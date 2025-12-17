package br.edu.ifmg.cli.models;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.jetbrains.annotations.Nullable;

public record CliDefinitions(List<CommandDef> commands, @Nullable List<OperatorDef> operators,
		@Nullable List<ControlDef> controls, List<CategoryDef> categories) {

	public record CommandDef(String id, String shellCommand, String label, String description, String color,
			String optionColor, List<OptionDef> options, List<List<String>> exclusiveOptions, List<OperandDef> operands,
			@Nullable List<OperandSyntaxRule> operandSyntaxRules, @Nullable String operandIdsSequenceSeparator) {
	}

	public record OptionDef(String flag, @Nullable String longFlag, String description,
			@Nullable ArgumentDef argument) {
	}

	public record ArgumentDef(String type, String label, String defaultValue, List<ValidationDef> validations) {
	}

	public record OperandDef(String id, String label, String description, String color, String type,
			String defaultValue, CardinalityDef cardinality, List<ValidationDef> validations) {
	}

	public record CardinalityDef(int min, String max) {
	}

	public record ValidationDef(String regex, String errorMessage) {
	}

	public record OperatorDef(String id, String label, String description, String color, List<SlotDef> slots,
			List<String> slotsWithImplicitData) {
	}

	public record OperandSyntaxRule(String regexPattern, @Nullable String errorMessage) {
	}

	public record ControlDef(String id, String shellCommand, String label, String description, String color,
			String syntaxEnd, List<SlotDef> slots) {
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