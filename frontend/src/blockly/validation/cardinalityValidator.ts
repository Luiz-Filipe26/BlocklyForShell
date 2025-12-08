import * as Blockly from "blockly";
import * as CLI from "@/types/cli";
import { getBlockSemanticData } from "@/blockly/serialization/metadataManager";
import { clearError, setError } from "./validationManager";
import { getBlocksList, getParentInputName } from "@/blockly/blocks/blockUtils";

/**
 * Executa a Validação de Cardinalidade mínima e registra Erros de Falta de Componentes"
 */
export function validateCardinality(
    commandBlock: Blockly.Block,
    commandDefinition: CLI.CLICommand,
): void {
    clearAllOperandCardinalityErrors(commandBlock, commandDefinition);
    validateOptionsGroupCardinality(commandBlock, commandDefinition);

    if (shouldRelaxOperandChecks(commandBlock)) {
        return;
    }

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
    clearError(block, "CARDINALITY_MIN_OPTIONS");
    clearError(block, "CARDINALITY_MIN_OPERANDS");

    commandDefinition.operands.forEach((operand) =>
        clearError(block, `CARDINALITY_MISSING_OPERAND_${operand.name}`),
    );
}

function clearAllControlCardinalityErrors(
    block: Blockly.Block,
    controlDefinition: CLI.CLIControl,
): void {
    controlDefinition.slots.forEach((slot) =>
        clearError(block, `CONTROL_MISSING_SLOT_${slot.name}`),
    );
}

export function validateControlCardinality(
    block: Blockly.Block,
    controlDefinition: CLI.CLIControl,
): void {
    clearAllControlCardinalityErrors(block, controlDefinition);

    for (const slot of controlDefinition.slots) {
        if (!slot.obligatory) continue;

        const targetBlock = block.getInputTargetBlock(slot.name);
        const isEmpty = !targetBlock || getBlocksList(targetBlock).length === 0;

        if (isEmpty) {
            setError(
                block,
                `CONTROL_MISSING_SLOT_${slot.name}`,
                `O campo "${(slot.label || slot.name).replace(":", "")}" é obrigatório.`,
            );
        }
    }
}

/**
 * Verifica a cardinalidade mínima do grupo de opções.
 */
function validateOptionsGroupCardinality(
    block: Blockly.Block,
    commandDefinition: CLI.CLICommand,
): void {
    if (!commandDefinition.optionsMin) return;

    const currentCount = getBlocksList(
        block.getInputTargetBlock("OPTIONS"),
    ).length;
    const missing = Math.max(0, commandDefinition.optionsMin - currentCount);

    if (missing == 0) return;
    setError(
        block,
        "CARDINALITY_MIN_OPTIONS",
        `Faltam opções obrigatórias (${missing}).`,
    );
}

/**
 * Verifica se o bloco está conectado a um slot que já fornece dados (Ex: Pipe).
 */
function shouldRelaxOperandChecks(block: Blockly.Block): boolean {
    const parent = block.getSurroundParent();
    const slotName = getParentInputName(block);
    if (!parent || !slotName) return false;
    const parentData = getBlockSemanticData(parent);
    return Boolean(
        parentData?.nodeType === "operator" &&
        parentData.slotsWithImplicitData?.includes(slotName),
    );
}

/**
 * Verifica a cardinalidade mínima do grupo de operandos.
 */
function validateOperandsGroupCardinality(
    block: Blockly.Block,
    commandDefinition: CLI.CLICommand,
): void {
    if (!commandDefinition.operandsMin) return;

    const currentCount = getBlocksList(
        block.getInputTargetBlock("OPERANDS"),
    ).length;
    const missing = Math.max(0, commandDefinition.operandsMin - currentCount);

    if (missing == 0) return;
    setError(
        block,
        "CARDINALITY_MIN_OPERANDS",
        `Faltam operandos obrigatórios (${missing} no mínimo).`,
    );
}

/**
 * Verifica a cardinalidade mínima de cada tipo específico de operando.
 */
function validateSpecificOperandsCardinality(
    block: Blockly.Block,
    commandDefinition: CLI.CLICommand,
): void {
    if (commandDefinition.operands.length === 0) return;

    const allBlocks = getBlocksList(block.getInputTargetBlock("OPERANDS"));

    const countsByType = new Map<string, number>();
    for (const child of allBlocks) {
        const current = countsByType.get(child.type) || 0;
        countsByType.set(child.type, current + 1);
    }

    for (const operandDef of commandDefinition.operands) {
        const operandType = `${commandDefinition.id}_${operandDef.name}_operand`;
        const count = countsByType.get(operandType) || 0;
        const min = operandDef.cardinality?.min ?? 0;
        const missing = Math.max(0, min - count);

        if (missing == 0) continue;
        setError(
            block,
            `CARDINALITY_MISSING_OPERAND_${operandDef.name}`,
            `Falta operando: ${operandDef.name} (precisa de ${missing}).`,
        );
    }
}
