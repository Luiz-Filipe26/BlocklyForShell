import * as Blockly from "blockly";
import * as CLI from "../types/cli";
import * as BlockIDs from "../constants/blockIds";
import { clearError, setError } from "../validation/validationManager";
import * as BlockTraversal from "../helpers/blockTraversal";
import * as ValidationErrors from "../constants/validationErrors";
import { getOperatorDefinition } from "../blocks/operatorBlocks";

export function validateControlCardinality(
    block: Blockly.Block,
    controlDefinition: CLI.CLIControl,
): void {
    clearAllControlCardinalityErrors(block, controlDefinition);

    for (const slot of controlDefinition.slots) {
        if (!slot.obligatory) continue;

        const targetBlock = block.getInputTargetBlock(slot.name);
        const isEmpty =
            !targetBlock ||
            BlockTraversal.getBlocksList(targetBlock).length === 0;

        if (isEmpty) {
            setError(
                block,
                ValidationErrors.controlMissingSlotError(slot),
                `O campo "${(slot.label || slot.name).replace(":", "")}" é obrigatório.`,
            );
        }
    }
}

function clearAllControlCardinalityErrors(
    block: Blockly.Block,
    controlDefinition: CLI.CLIControl,
): void {
    controlDefinition.slots.forEach((slot) =>
        clearError(block, ValidationErrors.controlMissingSlotError(slot)),
    );
}

/**
 * Executa a validação de cardinalidade mínima do comando.
 */
export function validateCardinality(
    commandBlock: Blockly.Block,
    commandDefinition: CLI.CLICommand,
    blocks: {
        options: Blockly.Block[];
        operands: Blockly.Block[];
    },
): void {
    clearAllOperandCardinalityErrors(commandBlock, commandDefinition);
    validateOptionsGroupCardinality(
        commandBlock,
        commandDefinition,
        blocks.options,
    );

    if (shouldRelaxOperandChecks(commandBlock)) return;

    validateOperandsGroupCardinality(
        commandBlock,
        commandDefinition,
        blocks.operands,
    );
    validateSpecificOperandsCardinality(
        commandBlock,
        commandDefinition,
        blocks.operands,
    );
}

function clearAllOperandCardinalityErrors(
    block: Blockly.Block,
    commandDefinition: CLI.CLICommand,
): void {
    clearError(
        block,
        ValidationErrors.VALIDATION_ERRORS.CARDINALITY_MIN_OPTIONS,
    );
    clearError(
        block,
        ValidationErrors.VALIDATION_ERRORS.CARDINALITY_MIN_OPERANDS,
    );

    commandDefinition.operands.forEach((operand) =>
        clearError(
            block,
            ValidationErrors.cardinalityMissingOperandError(operand),
        ),
    );
}

export function validateOperatorIntegrity(
    block: Blockly.Block,
    operatorDefinition: CLI.CLIOperator,
): void {
    for (const slot of operatorDefinition.slots || []) {
        const emptyError = ValidationErrors.operatorEmptySlotError(slot);
        const stackedError = ValidationErrors.operatorStackedSlotError(slot);

        clearError(block, emptyError);
        clearError(block, stackedError);

        if (isOperatorSlotEmpty(block, slot)) {
            setError(
                block,
                emptyError,
                `O slot "${slot.label || slot.name}" é obrigatório.`,
            );
            continue;
        }

        if (isOperatorSlotStacked(block, slot)) {
            setError(
                block,
                stackedError,
                `Operadores aceitam apenas um comando por slot. Use um bloco de agrupamento ou subshell se precisar de sequência.`,
            );
        }
    }
}

function isOperatorSlotEmpty(
    block: Blockly.Block,
    slot: CLI.CLIControlSlot,
): boolean {
    const targetBlock = block.getInputTargetBlock(slot.name);
    return !targetBlock;
}

function isOperatorSlotStacked(
    block: Blockly.Block,
    slot: CLI.CLIControlSlot,
): boolean {
    const targetBlock = block.getInputTargetBlock(slot.name);
    return Boolean(targetBlock?.getNextBlock());
}

function validateOptionsGroupCardinality(
    block: Blockly.Block,
    commandDefinition: CLI.CLICommand,
    optionBlocks: Blockly.Block[],
): void {
    if (!commandDefinition.optionsMin) return;

    const currentCount = optionBlocks.length;
    const missing = Math.max(0, commandDefinition.optionsMin - currentCount);

    if (missing === 0) return;

    setError(
        block,
        ValidationErrors.VALIDATION_ERRORS.CARDINALITY_MIN_OPTIONS,
        `Faltam opções obrigatórias (${missing}).`,
    );
}

function shouldRelaxOperandChecks(block: Blockly.Block): boolean {
    const parent = block.getSurroundParent();
    if (!parent) return false;

    const operatorDefinition = getOperatorDefinition(parent.type);
    if (!operatorDefinition) return false;

    const slotName = BlockTraversal.getParentInputName(block);
    if (!slotName) return false;

    return (
        operatorDefinition.slotsWithImplicitData?.includes(slotName) ?? false
    );
}

function validateOperandsGroupCardinality(
    block: Blockly.Block,
    commandDefinition: CLI.CLICommand,
    operandBlocks: Blockly.Block[],
): void {
    if (!commandDefinition.operandsMin) return;

    const currentCount = operandBlocks.length;
    const missing = Math.max(0, commandDefinition.operandsMin - currentCount);

    if (missing === 0) return;

    setError(
        block,
        ValidationErrors.VALIDATION_ERRORS.CARDINALITY_MIN_OPERANDS,
        `Faltam operandos obrigatórios (${missing} no mínimo).`,
    );
}

function validateSpecificOperandsCardinality(
    block: Blockly.Block,
    commandDefinition: CLI.CLICommand,
    operandBlocks: Blockly.Block[],
): void {
    if (commandDefinition.operands.length === 0) return;

    const countsByType = new Map<string, number>();
    for (const child of operandBlocks) {
        const current = countsByType.get(child.type) || 0;
        countsByType.set(child.type, current + 1);
    }

    for (const operandDef of commandDefinition.operands) {
        const operandType = BlockIDs.commandOperandBlockType(
            commandDefinition,
            operandDef,
        );

        const count = countsByType.get(operandType) || 0;
        const min = operandDef.cardinality?.min ?? 0;

        const missing = Math.max(0, min - count);
        if (missing === 0) continue;

        setError(
            block,
            ValidationErrors.cardinalityMissingOperandError(operandDef),
            `Falta operando: ${operandDef.label} (precisa de ${missing}).`,
        );
    }
}
