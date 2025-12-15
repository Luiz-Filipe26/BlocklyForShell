package br.edu.ifmg.cli.services;

import br.edu.ifmg.cli.models.ast.AstNode;
import br.edu.ifmg.cli.models.ast.SemanticBinding;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ScriptGenerator {

	public String generate(AstNode rootNode) {
		if (rootNode == null)
			throw new IllegalArgumentException("AST não pode ser nula");

		// A raiz é um script_node, buscamos seus filhos lógicos "commands"
		// Note que "commands" é a KEY do binding no ast.ts, não o nome do input
		List<AstNode> commandNodes = extractChildren(rootNode, "commands");

		return commandNodes.stream().map(this::dispatch).filter(s -> !s.isBlank()).collect(Collectors.joining("\n"));
	}

	private String dispatch(AstNode node) {
		if (node == null || node.semanticData() == null)
			return "";

		String kind = node.semanticData().kind();

		return switch (kind) {
		case "command" -> generateCommand(node);
		case "control" -> generateControl(node);
		case "operator" -> generateOperator(node);
		// Options e Operands são consumidos pelos pais, não geram código sozinhos aqui
		default -> "";
		};
	}

	// --- 1. COMANDOS (100% Dinâmico via AST) ---
	private String generateCommand(AstNode node) {
		StringBuilder sb = new StringBuilder();

		// Nome do comando vem do semantic data (ex: "ls", "grep")
		sb.append(node.semanticData().name());

		// Processa Opções
		List<AstNode> options = extractChildren(node, "options");
		for (AstNode opt : options) {
			String flag = extractValue(opt, "flag");
			String arg = extractValue(opt, "argument"); // Chave 'argument' conforme seu último ast.ts

			if (flag != null && !flag.isBlank()) {
				sb.append(" ").append(flag);
				if (arg != null && !arg.isBlank()) {
					sb.append(" ").append(quoteArgument(arg));
				}
			}
		}

		// Processa Operandos
		List<AstNode> operands = extractChildren(node, "operands");
		for (AstNode op : operands) {
			String val = extractValue(op, "value");
			if (val != null && !val.isBlank()) {
				sb.append(" ").append(quoteArgument(val));
			}
		}

		return sb.toString();
	}

	// --- 2. OPERADORES (Estático - Sintaxe Bash) ---
	private String generateOperator(AstNode node) {
		String opName = node.semanticData().name();
		String symbol = getBashOperatorSymbol(opName);

		// Assume que operadores binários têm slots A e B (ou genéricos)
		// Itera sobre os bindings na ordem que vieram do front
		List<String> parts = new ArrayList<>();

		for (SemanticBinding binding : node.semanticData().bindings()) {
			List<AstNode> children = extractChildren(node, binding.key());

			String slotCode = children.stream().map(this::dispatch).collect(Collectors.joining("\n"));

			if (!slotCode.isBlank()) {
				// Se for multiline, coloca parênteses (subshell visual) para não quebrar
				// sintaxe
				if (slotCode.contains("\n"))
					slotCode = "(" + indent(slotCode) + ")";
				parts.add(slotCode);
			}
		}

		// Monta: Parte1 [SYMBOL] Parte2 [SYMBOL] Parte3...
		return String.join(" " + symbol + " ", parts);
	}

	// --- 3. CONTROLES (Estático - Sintaxe Bash) ---
	private String generateControl(AstNode node) {
		String controlName = node.semanticData().name();

		// Aqui reside o conhecimento da sintaxe do Bash
		if ("if".equals(controlName)) {
			String cond = extractSlotCode(node, "CONDITION");
			String body = extractSlotCode(node, "DO");
			String elseBody = extractSlotCode(node, "ELSE");

			StringBuilder sb = new StringBuilder();
			sb.append("if ").append(cond).append("; then\n");
			sb.append(indent(body)).append("\n");
			if (!elseBody.isBlank()) {
				sb.append("else\n").append(indent(elseBody)).append("\n");
			}
			sb.append("fi");
			return sb.toString();
		}

		if ("while".equals(controlName)) {
			String cond = extractSlotCode(node, "CONDITION");
			String body = extractSlotCode(node, "DO");
			return "while " + cond + "; do\n" + indent(body) + "\ndone";
		}

		if ("for_files".equals(controlName)) { // Exemplo: for x in *.txt
			String variable = extractValue(node, "VAR_NAME"); // Se você tiver campos no controle
			String pattern = extractValue(node, "PATTERN");
			String body = extractSlotCode(node, "DO");
			// Fallbacks seguros se não vier do front
			variable = variable != null ? variable : "i";
			pattern = pattern != null ? pattern : "*";

			return "for " + variable + " in " + pattern + "; do\n" + indent(body) + "\ndone";
		}

		return "";
	}

	// --- AUXILIARES E "Dicionário Bash" ---

	private String getBashOperatorSymbol(String opSemanticName) {
		return switch (opSemanticName) {
		case "pipe" -> "|";
		case "redirect_stdout" -> ">";
		case "redirect_append" -> ">>";
		case "redirect_stdin" -> "<";
		case "and" -> "&&";
		case "or" -> "||";
		case "semicolon" -> ";";
		default -> " ";
		};
	}

	// --- ENGINE DE EXTRAÇÃO (AST DRIVEN) ---

	private String extractValue(AstNode node, String roleKey) {
		if (node.semanticData() == null)
			return null;

		return node.semanticData().bindings().stream().filter(b -> b.key().equals(roleKey)).findFirst()
				.flatMap(binding -> {
					if ("field".equals(binding.source())) {
						return node.getRawFieldValue(binding.name());
					}
					return java.util.Optional.empty();
				}).orElse(null);
	}

	private List<AstNode> extractChildren(AstNode node, String roleKey) {
		if (node.semanticData() == null)
			return Collections.emptyList();

		return node.semanticData().bindings().stream().filter(b -> b.key().equals(roleKey)).findFirst().map(binding -> {
			if ("input".equals(binding.source())) {
				return node.getRawInputChildren(binding.name());
			}
			return Collections.<AstNode>emptyList();
		}).orElse(Collections.emptyList());
	}

	private String extractSlotCode(AstNode node, String roleKey) {
		List<AstNode> children = extractChildren(node, roleKey);
		return children.stream().map(this::dispatch).collect(Collectors.joining("\n"));
	}

	private String quoteArgument(String raw) {
		if (raw == null || raw.isEmpty())
			return "''";
		// Aspas simples são as mais seguras no Bash, escapando a própria aspa simples
		return "'" + raw.replace("'", "'\\''") + "'";
	}

	private String indent(String code) {
		return code.lines().map(l -> "  " + l).collect(Collectors.joining("\n"));
	}
}