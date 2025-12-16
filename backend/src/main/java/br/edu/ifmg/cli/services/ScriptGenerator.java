package br.edu.ifmg.cli.services;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import br.edu.ifmg.cli.models.ast.AstNode;
import br.edu.ifmg.cli.models.ast.AstVocabulary.Keys;
import br.edu.ifmg.cli.models.ast.AstVocabulary.Nodes;
import br.edu.ifmg.cli.models.ast.AstVocabulary.Sources;
import br.edu.ifmg.cli.models.ast.AstVocabulary.Values;
import br.edu.ifmg.cli.models.ast.SemanticBinding;
import br.edu.ifmg.cli.models.ast.SemanticControlDefinition;
import br.edu.ifmg.cli.models.ast.SemanticControlSlot;
import br.edu.ifmg.cli.models.ast.SemanticOperatorDefinition;
import br.edu.ifmg.cli.models.ast.SemanticOperatorSlot;

public class ScriptGenerator {

	private final AstNavigator navigator = new AstNavigator();
	private static final Pattern SAFE_ARGUMENT_PATTERN = java.util.regex.Pattern.compile("^[a-zA-Z0-9._/-]+$");

	public String generate(AstNode rootNode) {
		if (rootNode == null)
			throw new IllegalArgumentException("AST não pode ser nula");
		return dispatch(rootNode);
	}

	private String dispatch(AstNode node) {
		if (node == null || node.semanticData() == null)
			return "";

		String kind = node.semanticData().nodeType();

		return switch (kind) {
		case Nodes.SCRIPT -> generateScript(node);
		case Nodes.COMMAND -> generateCommand(node);
		case Nodes.CONTROL -> generateControl(node);
		case Nodes.OPERATOR -> generateOperator(node);
		case Nodes.OPTION -> generateOption(node);
		case Nodes.OPERAND -> generateOperand(node);
		default -> "";
		};
	}

	private String generateScript(AstNode node) {
		var parts = new ArrayList<String>();
		var data = node.semanticData();

		for (var binding : data.bindings()) {
			String content = resolveBindingContent(node, binding, "\n");
			if (!content.isBlank()) {
				parts.add(content);
			}
		}
		return String.join("\n", parts);
	}

	private String generateCommand(AstNode node) {
		var sb = new StringBuilder();
		sb.append(node.semanticData().name());

		var optionNodes = navigator.extractChildren(node, Keys.OPTIONS);
		String optionsStr = renderNodeList(optionNodes, " ");
		if (!optionsStr.isBlank()) {
			sb.append(" ").append(optionsStr);
		}

		var operandNodes = navigator.extractChildren(node, Keys.OPERANDS);
		String operandsStr = renderNodeList(operandNodes, " ");
		if (!operandsStr.isBlank()) {
			sb.append(" ").append(operandsStr);
		}

		return sb.toString();
	}

	private String generateOption(AstNode node) {
		String flag = navigator.extractValue(node, Keys.FLAG).orElse("");
		String value = navigator.extractValue(node, Keys.VALUE).orElse("");

		StringBuilder sb = new StringBuilder();
		if (!flag.isBlank()) {
			sb.append(flag);
			if (!value.isBlank()) {
				sb.append(" ").append(quoteArgumentIfUnsafe(value));
			}
		}
		return sb.toString();
	}

	private String generateOperand(AstNode node) {
		String value = navigator.extractValue(node, Keys.VALUE).orElse("");
		if (!value.isBlank()) {
			return quoteArgumentIfUnsafe(value);
		}
		return "";
	}

	private String generateControl(AstNode node) {
		var sb = new StringBuilder();
		var data = node.semanticData();
		var controlDef = data.definition().control();

		sb.append(data.name());

		for (var binding : data.bindings()) {
			String content = resolveBindingContent(node, binding, "\n");

			if (content.isBlank())
				continue;

			findControlSlot(controlDef, binding.key()).map(SemanticControlSlot::syntaxPrefix).ifPresent(sb::append);

			if (content.contains("\n")) {
				sb.append("\n").append(indent(content));
			} else {
				sb.append(" ").append(content);
			}
		}

		if (controlDef.syntaxEnd() != null) {
			sb.append("\n").append(controlDef.syntaxEnd());
		}
		return sb.toString().trim();
	}

	private String generateOperator(AstNode node) {
		var sb = new StringBuilder();
		var data = node.semanticData();
		var operatorDef = data.definition().operator();

		for (var binding : data.bindings()) {
			String content = resolveBindingContent(node, binding, " ");

			if (content.isBlank())
				continue;

			String finalContent = findOperatorSlot(operatorDef, binding.key()).map(slot -> {
				String symbol = slot.symbol();
				if (symbol == null)
					return content;

				boolean isBefore = Values.PLACEMENT_BEFORE.equals(slot.symbolPlacement());
				return isBefore ? " " + symbol + " " + content : content + " " + symbol + " ";
			}).orElse(content);

			sb.append(finalContent);
		}
		return sb.toString().trim();
	}

	private String resolveBindingContent(AstNode node, SemanticBinding binding, String separator) {
		if (Sources.INPUT.equals(binding.source())) {
			var children = navigator.getNodesFromBinding(node, binding);
			return renderNodeList(children, separator);
		} else if (Sources.FIELD.equals(binding.source())) {
			return navigator.getValueFromBinding(node, binding).orElse("");
		}
		return "";
	}

	private String renderNodeList(List<AstNode> nodes, String separator) {
		return nodes.stream().map(this::dispatch).filter(result -> !result.isBlank())
				.collect(Collectors.joining(separator));
	}

	private Optional<SemanticControlSlot> findControlSlot(SemanticControlDefinition controlDef, String key) {
		if (controlDef == null)
			return Optional.empty();
		return controlDef.slots().stream().filter(slot -> slot.name().equals(key)).findFirst();
	}

	private Optional<SemanticOperatorSlot> findOperatorSlot(SemanticOperatorDefinition operatorDef, String key) {
		if (operatorDef == null)
			return Optional.empty();
		return operatorDef.slots().stream().filter(slot -> slot.name().equals(key)).findFirst();
	}

	private String quoteArgumentIfUnsafe(String rawArgument) {
		if (rawArgument == null || rawArgument.isEmpty())
			return "''";
		if (SAFE_ARGUMENT_PATTERN.matcher(rawArgument).matches()) {
	        return rawArgument;
	    }
		
		return "'" + rawArgument.replace("'", "'\\''") + "'";
	}

	private String indent(String code) {
		return code.lines().map(line -> "  " + line).collect(Collectors.joining("\n"));
	}
}