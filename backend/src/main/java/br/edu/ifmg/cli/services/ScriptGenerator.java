package br.edu.ifmg.cli.services;

import br.edu.ifmg.cli.models.ast.*;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

public class ScriptGenerator {

	public String generate(AstNode rootNode) {
		if (rootNode == null)
			throw new IllegalArgumentException("AST não pode ser nula");
		List<AstNode> commandNodes = extractChildren(rootNode, "commands");
		return processChildList(commandNodes, "\n");
	}

	private String dispatch(AstNode node) {
		if (node == null || node.semanticData() == null)
			return "";

		String kind = node.semanticData().nodeType();

		if ("command".equals(kind)) {
			return generatePosixCommand(node);
		} else {
			// Unifica a lógica de Controles e Operadores
			return generateGenericStructure(node);
		}
	}

	// --- LÓGICA 1: ESTRUTURAS GENÉRICAS (Defined by Syntax) ---
	private String generateGenericStructure(AstNode node) {
		StringBuilder sb = new StringBuilder();
		var data = node.semanticData();
		var def = data.definition();

		// 1. Identidade
		// Controles escrevem seu nome ("if"). Operadores são simbólicos ("pipe" não se
		// escreve).
		if ("control".equals(data.nodeType())) {
			sb.append(data.name());
		}

		// 2. Bindings (Filhos + Sintaxe)
		for (SemanticBinding binding : data.bindings()) {

			String prefix = getPrefixForSlot(def, binding.key());
			String symbol = getSymbolForSlot(def, binding.key());
			boolean isSymbolBefore = isSymbolBefore(def, binding.key());

			// Prefixo ou Símbolo Before
			if (prefix != null)
				sb.append(prefix);
			if (symbol != null && isSymbolBefore)
				sb.append(" ").append(symbol);

			// Código do Filho
			String childCode = processChildList(extractChildrenNodes(node, binding), " ");

			if (!childCode.isBlank()) {
				// Indenta se for controle (multiline)
				if (childCode.contains("\n") && "control".equals(data.nodeType())) {
					sb.append("\n").append(indent(childCode));
				} else {
					sb.append(" ").append(childCode);
				}
			}

			// Símbolo After
			if (symbol != null && !isSymbolBefore)
				sb.append(" ").append(symbol);
		}

		// 3. Fechamento (fi, done)
		String globalSuffix = getSyntaxEnd(def);
		if (globalSuffix != null && !globalSuffix.isBlank()) {
			sb.append("\n").append(globalSuffix);
		}

		return sb.toString().trim();
	}

	// --- LÓGICA 2: COMANDOS POSIX (Standard) ---
	private String generatePosixCommand(AstNode node) {
		StringBuilder sb = new StringBuilder();
		sb.append(node.semanticData().name()); // "ls"

		appendOptions(sb, node);
		appendOperands(sb, node);

		return sb.toString();
	}

	// --- EXTRAÇÃO E HELPERS ---

	private String processChildList(List<AstNode> nodes, String separator) {
		return nodes.stream().map(this::dispatch).filter(s -> !s.isBlank()).collect(Collectors.joining(separator));
	}

	private List<AstNode> extractChildren(AstNode node, String key) {
		if (node.semanticData() == null)
			return Collections.emptyList();
		return node.semanticData().bindings().stream().filter(b -> b.key().equals(key)).findFirst()
				.map(b -> extractChildrenNodes(node, b)).orElse(Collections.emptyList());
	}

	private List<AstNode> extractChildrenNodes(AstNode node, SemanticBinding binding) {
		if ("input".equals(binding.source())) {
			return node.getRawInputChildren(binding.name());
		}
		return Collections.emptyList();
	}

	private String extractValue(AstNode node, String key) {
		if (node.semanticData() == null)
			return null;
		return node.semanticData().bindings().stream().filter(b -> b.key().equals(key)).findFirst().flatMap(binding -> {
			if ("field".equals(binding.source())) {
				return node.getRawFieldValue(binding.name());
			}
			return Optional.empty();
		}).orElse(null);
	}

	private void appendOptions(StringBuilder sb, AstNode node) {
		List<AstNode> options = extractChildren(node, "options");
		for (AstNode opt : options) {
			String flag = extractValue(opt, "flag");
			String arg = extractValue(opt, "value");
			if (flag != null && !flag.isBlank()) {
				sb.append(" ").append(flag);
				if (arg != null && !arg.isBlank())
					sb.append(" ").append(quoteArgument(arg));
			}
		}
	}

	private void appendOperands(StringBuilder sb, AstNode node) {
		List<AstNode> operands = extractChildren(node, "operands");
		for (AstNode op : operands) {
			String val = extractValue(op, "value");
			if (val != null && !val.isBlank())
				sb.append(" ").append(quoteArgument(val));
		}
	}

	// --- LEITURA DE DEFINIÇÕES ---

	private String getPrefixForSlot(SemanticDefinition def, String slotName) {
		if (def == null || def.control() == null)
			return null;
		return def.control().slots().stream().filter(s -> s.name().equals(slotName)).findFirst()
				.map(SemanticControlSlot::syntaxPrefix).orElse(null);
	}

	private String getSymbolForSlot(SemanticDefinition def, String slotName) {
		if (def == null || def.operator() == null)
			return null;
		return def.operator().slots().stream().filter(s -> s.name().equals(slotName)).findFirst()
				.map(SemanticOperatorSlot::symbol).orElse(null);
	}

	private boolean isSymbolBefore(SemanticDefinition def, String slotName) {
		if (def == null || def.operator() == null)
			return false;
		return def.operator().slots().stream().filter(s -> s.name().equals(slotName)).findFirst()
				.map(s -> "before".equals(s.symbolPlacement())).orElse(false);
	}

	private String getSyntaxEnd(SemanticDefinition def) {
		if (def == null || def.control() == null)
			return null;
		return def.control().syntaxEnd();
	}

	private String quoteArgument(String raw) {
		if (raw == null || raw.isEmpty())
			return "''";
		return "'" + raw.replace("'", "'\\''") + "'";
	}

	private String indent(String code) {
		return code.lines().map(l -> "  " + l).collect(Collectors.joining("\n"));
	}
}