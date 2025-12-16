import type { CLIOperand, CLIControlSlot } from "../types/cli";

export const VALIDATION_ERRORS = {
    CARDINALITY_MIN_OPTIONS: "CARDINALITY_MIN_OPTIONS",
    CARDINALITY_MIN_OPERANDS: "CARDINALITY_MIN_OPERANDS",
} as const;

export type FixedValidationError =
    (typeof VALIDATION_ERRORS)[keyof typeof VALIDATION_ERRORS];

export const VALIDATION_ERROR_PREFIXES = {
    CARDINALITY: "CARDINALITY_",
} as const;

export type ControlMissingSlot = `CONTROL_MISSING_SLOT_${string}`;
export type OperatorEmptySlot = `OPERATOR_EMPTY_SLOT_${string}`;
export type OperatorStackedSlot = `OPERATOR_STACKED_SLOT_${string}`;
export type CardinalityMissingOperand = `CARDINALITY_MISSING_OPERAND_${string}`;

export type OperandRegexRuleError = `OPERAND_REGEX_RULE_${number}`;

export function controlMissingSlotError(
    slot: CLIControlSlot,
): ControlMissingSlot {
    return `CONTROL_MISSING_SLOT_${slot.name}`;
}

export function operatorEmptySlotError(
    slot: CLIControlSlot,
): OperatorEmptySlot {
    return `OPERATOR_EMPTY_SLOT_${slot.name}`;
}

export function operatorStackedSlotError(
    slot: CLIControlSlot,
): OperatorStackedSlot {
    return `OPERATOR_STACKED_SLOT_${slot.name}`;
}

export function cardinalityMissingOperandError(
    operand: CLIOperand,
): CardinalityMissingOperand {
    return `CARDINALITY_MISSING_OPERAND_${operand.id}`;
}

export function operandRegexRuleError(index: number): OperandRegexRuleError {
    return `OPERAND_REGEX_RULE_${index}`;
}

export type ValidationErrorCode =
    | FixedValidationError
    | ControlMissingSlot
    | OperatorEmptySlot
    | OperatorStackedSlot
    | CardinalityMissingOperand
    | OperandRegexRuleError;
