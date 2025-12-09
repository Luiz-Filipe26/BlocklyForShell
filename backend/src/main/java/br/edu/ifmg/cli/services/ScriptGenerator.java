package br.edu.ifmg.cli.services;

import br.edu.ifmg.cli.models.AstNode;
import br.edu.ifmg.cli.models.CliDefinitions;
import br.edu.ifmg.cli.models.CliDefinitions.ControlDef;
import br.edu.ifmg.cli.models.CliDefinitions.OperatorDef;
import br.edu.ifmg.cli.models.CliDefinitions.SlotDef;
import com.google.gson.Gson;

import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class ScriptGenerator {

	private final Map<String, OperatorDef> operatorsMap;
	private final Map<String, ControlDef> controlsMap;

	public ScriptGenerator() {
		try (var stream = getClass().getResourceAsStream("/definitions/cli_definitions.json")) {
			if (stream == null)
				throw new RuntimeException("cli_definitions.json não encontrado!");

			var reader = new InputStreamReader(stream, StandardCharsets.UTF_8);
			CliDefinitions defs = new Gson().fromJson(reader, CliDefinitions.class);

			this.operatorsMap = defs.getOperatorsMap() != null ? Map.copyOf(defs.getOperatorsMap()) : Map.of();
			this.controlsMap = defs.getControlsMap() != null ? Map.copyOf(defs.getControlsMap()) : Map.of();

		} catch (Exception e) {
			throw new RuntimeException("Falha ao inicializar ScriptGenerator com definições", e);
		}
	}

	public String generate(AstNode rootNode) {
		if (rootNode == null) {
			throw new IllegalArgumentException("AST nula passada ao ScriptGenerator.");
		}

		StringBuilder sb = new StringBuilder();
		List<AstNode> commands = rootNode.getChildren("commands");

		for (AstNode node : commands) {
			String code = dispatch(node);
			if (code != null && !code.isBlank()) {
				sb.append(code.trim()).append("\n");
			}
		}

		return sb.toString().trim();
	}

	private String dispatch(AstNode node) {
		if (node == null)
			return "";

		return switch (node.getType()) {
		case "command" -> generateSimpleCommand(node);
		case "control" -> generateControl(node);
		case "operator" -> generateOperator(node);
		default -> throw new IllegalArgumentException("Tipo desconhecido na AST: " + node.getType());
		};
	}

	private String generateSimpleCommand(AstNode node) {
		var sem = node.semanticData();
		if (sem == null || sem.commandName() == null || sem.commandName().isBlank()) {
			throw new IllegalArgumentException("Comando sem semanticData válido.");
		}

		StringBuilder sb = new StringBuilder();
		sb.append(sem.commandName());

		for (AstNode opt : node.getChildren("OPTIONS")) {
			String flag = opt.getField("FLAG").orElse("").trim();
			if (!flag.isEmpty()) {
				sb.append(" ").append(flag);
			}
		}

		for (AstNode op : node.getChildren("OPERANDS")) {
			String value = op.getField("VALUE").orElse("");
			if (!value.isEmpty()) {
				sb.append(" ").append(quoteArgument(value));
			}
		}

		return sb.toString();
	}

	private String generateOperator(AstNode node) {
		var sem = node.semanticData();
		if (sem == null || sem.commandName() == null || sem.commandName().isBlank()) {
			throw new IllegalArgumentException("Operador sem semanticData válido.");
		}

		String opId = sem.commandName();
		OperatorDef def = operatorsMap.get(opId);
		if (def == null)
			throw new IllegalStateException("Operador não encontrado: " + opId);

		var slotContents = def.slots() == null ? List.<SlotPair>of()
				: def.slots().stream().map(slot -> new SlotPair(slot, resolveSlotContent(node, slot.name())))
						.collect(Collectors.toList());

		StringBuilder sb = new StringBuilder();
		boolean first = true;

		for (SlotPair sp : slotContents) {
			String child = sp.content().trim();
			if (child.isEmpty())
				continue;

			if (child.contains("\n")) {
				child = "(" + indentMultiline(child) + ")";
			}

			SlotDef slot = sp.slot();

			if (first) {
				sb.append(child);
				first = false;
				if (slot.symbol() != null && "after".equals(slot.symbolPlacement())) {
					sb.append(" ").append(slot.symbol()).append(" ");
				}
				continue;
			}

			if (slot.symbol() != null && "before".equals(slot.symbolPlacement())) {
				sb.append(" ").append(slot.symbol()).append(" ").append(child);
			} else if (slot.symbol() != null && "after".equals(slot.symbolPlacement())) {
				sb.append(" ").append(child).append(" ").append(slot.symbol());
			} else {
				sb.append(" ").append(child);
			}
		}

		return sb.toString().trim();
	}

	private String generateControl(AstNode node) {
		var sem = node.semanticData();
		if (sem == null || sem.commandName() == null || sem.commandName().isBlank()) {
			throw new IllegalArgumentException("Control sem semanticData válido.");
		}

		String controlId = sem.commandName();
		ControlDef def = controlsMap.get(controlId);
		if (def == null)
			throw new IllegalStateException("Controle não encontrado: " + controlId);

		StringBuilder sb = new StringBuilder();
		sb.append(def.shellCommand());

		List<SlotDef> slots = def.slots() == null ? List.of() : def.slots();

		boolean firstSlot = true;

		for (SlotDef slot : slots) {
			String slotContent = resolveSlotContent(node, slot.name()).trim();
			if (slotContent.isEmpty())
				continue;

			// Primeiro slot: testa condição
			if (firstSlot) {
				sb.append(" ");

				if (slotContent.contains("\n")) {
					slotContent = "(" + indentMultiline(slotContent) + ")";
				}

				sb.append(slotContent);

				if (slot.syntaxPrefix() != null && !slot.syntaxPrefix().isBlank()) {
					sb.append(" ; ").append(slot.syntaxPrefix().trim());
				}

				sb.append("\n");
				firstSlot = false;
				continue;
			}

			// Demais blocos (then, else, do, etc.)
			if (slot.syntaxPrefix() != null && !slot.syntaxPrefix().isBlank()) {
				sb.append(slot.syntaxPrefix().trim()).append("\n");
			}

			sb.append(indentMultiline(slotContent));
			sb.append("\n");
		}

		if (def.syntaxEnd() != null && !def.syntaxEnd().isBlank()) {
			sb.append(def.syntaxEnd());
		}

		return sb.toString().trim();
	}

	private record SlotPair(SlotDef slot, String content) {
	}

	private String resolveSlotContent(AstNode parent, String slotName) {
		StringBuilder sb = new StringBuilder();
		List<AstNode> children = parent.getChildren(slotName);
		for (AstNode child : children) {
			String code = dispatch(child);
			if (code != null && !code.isBlank()) {
				sb.append(code.trim()).append("\n");
			}
		}
		return sb.toString().trim();
	}

	private static String quoteArgument(String rawInput) {
		if (rawInput == null || rawInput.isEmpty())
			return "''";
		return "'" + rawInput.replace("'", "'\\''") + "'";
	}

	private static String indentMultiline(String s) {
		return List.of(s.split("\n")).stream().map(line -> "  " + line).collect(Collectors.joining("\n"));
	}
}
