package br.edu.ifmg.cli.services;

import br.edu.ifmg.cli.models.AstNode;
import br.edu.ifmg.cli.models.CliDefinitions;
import br.edu.ifmg.cli.models.CliDefinitions.ControlDef;
import br.edu.ifmg.cli.models.CliDefinitions.OperatorDef;
import com.google.gson.Gson;

import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

public class ScriptGenerator {

	private final Map<String, OperatorDef> operatorsMap;
	private final Map<String, ControlDef> controlsMap;

	public ScriptGenerator() {
		try (var stream = getClass().getResourceAsStream("/definitions/cli_definitions.json")) {
			if (stream == null)
				throw new RuntimeException("cli_definitions.json não encontrado!");

			var reader = new InputStreamReader(stream, StandardCharsets.UTF_8);
			CliDefinitions defs = new Gson().fromJson(reader, CliDefinitions.class);

			this.operatorsMap = defs.getOperatorsMap();
			this.controlsMap = defs.getControlsMap();

		} catch (Exception e) {
			throw new RuntimeException("Falha ao inicializar ScriptGenerator com definições", e);
		}
	}

	public String generate(AstNode rootNode) {
		if (rootNode == null)
			return "# ERRO: AST nula.";

		StringBuilder sb = new StringBuilder();

		List<AstNode> commands = rootNode.getChildren("commands");

		for (AstNode node : commands) {
			String code = dispatch(node);
			if (!code.isEmpty()) {
				sb.append(code).append("\n");
			}
		}

		return sb.toString().trim();
	}
	
	private String dispatch(AstNode node) {
		String type = node.getType();

		return switch (type) {
		case "command" -> generateSimpleCommand(node);
		case "control" -> generateControl(node);
		case "operator" -> generateOperator(node);
		default -> "# Tipo desconhecido: " + type;
		};
	}
	
	private String generateSimpleCommand(AstNode node) {
		if (node.semanticData() == null)
			return "";

		StringBuilder sb = new StringBuilder();
		sb.append(node.semanticData().commandName());

		for (AstNode opt : node.getChildren("OPTIONS")) {
			String flag = opt.getField("FLAG").orElse("");
			if (!flag.isEmpty())
				sb.append(" ").append(flag);
		}

		for (AstNode op : node.getChildren("OPERANDS")) {
			String value = op.getField("VALUE").orElse("");
			if (!value.isEmpty())
				sb.append(" ").append(quoteArgument(value));
		}

		return sb.toString();
	}

	private String generateOperator(AstNode node) {
		String opId = node.semanticData().commandName();

		OperatorDef def = operatorsMap.get(opId);
		if (def == null)
			return "# Erro: Operador não definido no JSON: " + opId;

		String symbol = def.command();

		AstNode left = getSingleChild(node, "A");
		AstNode right = getSingleChild(node, "B");

		if (left == null || right == null) {
			return "# Erro: Operador " + symbol + " incompleto";
		}

		return dispatch(left) + " " + symbol + " " + dispatch(right);
	}

	private String generateControl(AstNode node) {
		String controlId = node.semanticData().commandName();

		ControlDef def = controlsMap.get(controlId);
		if (def == null)
			return "# Erro: Controle não definido no JSON: " + controlId;

		String bashCommand = def.command();

		if ("if".equals(bashCommand)) {
			return generateIfTemplate(node);
		} else if ("while".equals(bashCommand)) {
			return generateWhileTemplate(node);
		}

		return "# Erro: Template Bash desconhecido para: " + bashCommand;
	}

	private String generateIfTemplate(AstNode node) {
		String condition = resolveCondition(node);
		String doBlock = resolveBlock(node, "DO");
		String elseBlock = resolveBlock(node, "ELSE");

		StringBuilder sb = new StringBuilder();
		sb.append("if ").append(condition).append("; then\n");
		sb.append(doBlock);

		if (!elseBlock.isEmpty()) {
			sb.append("else\n").append(elseBlock);
		}
		sb.append("fi");
		return sb.toString();
	}

	private String generateWhileTemplate(AstNode node) {
		String condition = resolveCondition(node);
		String doBlock = resolveBlock(node, "DO");

		return "while " + condition + "; do\n" + doBlock + "done";
	}


	private String resolveCondition(AstNode parent) {
		AstNode condNode = getSingleChild(parent, "CONDITION");
		return (condNode != null) ? dispatch(condNode) : "true";
	}

	private String resolveBlock(AstNode parent, String slotName) {
		StringBuilder sb = new StringBuilder();
		List<AstNode> children = parent.getChildren(slotName);
		for (AstNode child : children) {
			sb.append("  ").append(dispatch(child)).append("\n");
		}
		return sb.toString();
	}

	private AstNode getSingleChild(AstNode parent, String inputName) {
		List<AstNode> children = parent.getChildren(inputName);
		return children.isEmpty() ? null : children.get(0);
	}

	private String quoteArgument(String rawInput) {
		if (rawInput == null || rawInput.isEmpty())
			return "''";
		return "'" + rawInput.replace("'", "'\\''") + "'";
	}
}