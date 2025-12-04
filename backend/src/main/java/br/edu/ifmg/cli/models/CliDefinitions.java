package br.edu.ifmg.cli.models;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public record CliDefinitions(List<CommandDef> commands, List<OperatorDef> operators, List<ControlDef> controls) {
	public record CommandDef(String command, String name) {
	}

	public record OperatorDef(String id, String command) {
	}

	public record ControlDef(String id, String command, List<SlotDef> slots) {
	}

	public record SlotDef(String name, String type) {
	}

	public Map<String, OperatorDef> getOperatorsMap() {
		return operators.stream().collect(Collectors.toMap(OperatorDef::id, o -> o));
	}

	public Map<String, ControlDef> getControlsMap() {
		return controls.stream().collect(Collectors.toMap(ControlDef::id, c -> c));
	}
}