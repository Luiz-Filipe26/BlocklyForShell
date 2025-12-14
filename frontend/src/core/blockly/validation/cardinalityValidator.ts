import * as Blockly from "blockly";
import * as CLI from "@/types/cli";
import * as BlockIDs from "../constants/blockIds";
import { getBlockSemanticData } from "../serialization/metadataManager";
import { clearError, setError } from "../validation/validationManager";
import * as BlockTraversal from "../helpers/blockTraversal";
import * as ValidationErrors from "../constants/validationErrors";

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
): void {
    clearAllOperandCardinalityErrors(commandBlock, commandDefinition);
    validateOptionsGroupCardinality(commandBlock, commandDefinition);

    if (shouldRelaxOperandChecks(commandBlock)) return;

    validateOperandsGroupCardinality(commandBlock, commandDefinition);
    validateSpecificOperandsCardinality(commandBlock, commandDefinition);
}

/**
 * Limpa todos os possíveis erros de cardinalidade do bloco.
 */
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

/**
 * Valida se o operador possui todos os slots preenchidos e sem blocos empilhados.
 */
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

/**
 * Valida cardinalidade mínima do grupo de opções.
 */
function validateOptionsGroupCardinality(
    block: Blockly.Block,
    commandDefinition: CLI.CLICommand,
): void {
    if (!commandDefinition.optionsMin) return;

    const currentCount = BlockTraversal.getBlocksList(
        block.getInputTargetBlock(BlockIDs.INPUTS.OPTIONS),
    ).length;

    const missing = Math.max(0, commandDefinition.optionsMin - currentCount);

    if (missing === 0) return;

    setError(
        block,
        ValidationErrors.VALIDATION_ERRORS.CARDINALITY_MIN_OPTIONS,
        `Faltam opções obrigatórias (${missing}).`,
    );
}

/**
 * Verifica se o bloco está conectado a um slot que já fornece dados (Ex: Pipe).
 */
function shouldRelaxOperandChecks(block: Blockly.Block): boolean {
    const parent = block.getSurroundParent();
    const slotName = BlockTraversal.getParentInputName(block);
    if (!parent || !slotName) return false;

    const parentData = getBlockSemanticData(parent);

    return Boolean(
        parentData?.nodeType === "operator" &&
        parentData.slotsWithImplicitData?.includes(slotName),
    );
}

/**
 * Verifica cardinalidade mínima do grupo de operandos.
 */
function validateOperandsGroupCardinality(
    block: Blockly.Block,
    commandDefinition: CLI.CLICommand,
): void {
    if (!commandDefinition.operandsMin) return;

    const currentCount = BlockTraversal.getBlocksList(
        block.getInputTargetBlock(BlockIDs.INPUTS.OPERANDS),
    ).length;

    const missing = Math.max(0, commandDefinition.operandsMin - currentCount);

    if (missing === 0) return;

    setError(
        block,
        ValidationErrors.VALIDATION_ERRORS.CARDINALITY_MIN_OPERANDS,
        `Faltam operandos obrigatórios (${missing} no mínimo).`,
    );
}

/**
 * Verifica cardinalidade mínima por tipo específico de operando.
 */
function validateSpecificOperandsCardinality(
    block: Blockly.Block,
    commandDefinition: CLI.CLICommand,
): void {
    if (commandDefinition.operands.length === 0) return;

    const allBlocks = BlockTraversal.getBlocksList(
        block.getInputTargetBlock(BlockIDs.INPUTS.OPERANDS),
    );

    const countsByType = new Map<string, number>();
    for (const child of allBlocks) {
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
