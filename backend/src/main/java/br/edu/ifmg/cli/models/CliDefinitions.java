package br.edu.ifmg.cli.models;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public record CliDefinitions(List<CommandDef> commands, List<OperatorDef> operators, List<ControlDef> controls,
		List<CategoryDef> categories) {

	public record CommandDef(String id, String shellCommand, String presentationName, String description, String color,
			String optionColor, List<OptionDef> options, List<List<String>> exclusiveOptions,
			List<OperandDef> operands) {
	}

	public record OptionDef(String flag, String longFlag, String description, boolean takesArgument) {
	}

	public record OperandDef(String name, String description, String color, String type, String defaultValue,
			CardinalityDef cardinality, List<ValidationDef> validations) {
	}

	public record CardinalityDef(int min, String max) {
	}

	public record ValidationDef(String regex, String errorMessage) {
	}

	public record OperatorDef(String id, String command, String name, String description, String color,
			List<SlotDef> slots, List<String> slotsWithImplicitData) {
	}

	public record ControlDef(String id, String command, String name, String description, String color, String syntaxEnd,
			List<SlotDef> slots) {
	}

	public record SlotDef(String name, String type, String label, String check, String symbol, String symbolPlacement,
			String syntaxPrefix, boolean obligatory) {
	}

	public record CategoryDef(String name, List<String> commands) {
	}

	public Map<String, OperatorDef> getOperatorsMap() {
		return operators.stream().collect(Collectors.toUnmodifiableMap(OperatorDef::id, operator -> operator));
	}

	public Map<String, ControlDef> getControlsMap() {
		return controls.stream().collect(Collectors.toUnmodifiableMap(ControlDef::id, control -> control));
	}
}