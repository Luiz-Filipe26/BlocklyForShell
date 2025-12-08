import * as Blockly from "blockly";
import * as CLI from "@/types/cli";
import { getBlockSemanticData } from "@/blockly/serialization/metadataManager";
import { clearError, setError } from "./validationManager";
import { getBlocksList } from "@/blockly/blocks/blockUtils";

/**
 * Executa a Validação de Cardinalidade mínima e registra Erros de Falta de Componentes"
 */
export function validateCardinality(
    commandBlock: Blockly.Block,
    commandDefinition: CLI.CLICommand,
): void {
    clearAllCardinalityErrors(commandBlock, commandDefinition);

    const parentBlock = commandBlock.getSurroundParent();
    if (
        parentBlock &&
        getBlockSemanticData(parentBlock)?.nodeType === "operator"
    )
        return;

    validateOptionsGroupCardinality(commandBlock, commandDefinition);
    validateOperandsGroupCardinality(commandBlock, commandDefinition);
    validateSpecificOperandsCardinality(commandBlock, commandDefinition);
}

/**
 * Limpa todos os possíveis erros de cardinalidade do bloco.
 */
function clearAllCardinalityErrors(
    block: Blockly.Block,
    commandDefinition: CLI.CLICommand,
): void {
    clearError(block, "CARDINALITY_MIN_OPTIONS");
    clearError(block, "CARDINALITY_MIN_OPERANDS");

    commandDefinition.operands.forEach((operand) =>
        clearError(block, `CARDINALITY_MISSING_OPERAND_${operand.name}`),
    );
}

/**
 * Verifica a cardinalidade mínima do grupo de opções.
 */
function validateOptionsGroupCardinality(
    block: Blockly.Block,
    commandDefinition: CLI.CLICommand,
): void {
    if (!commandDefinition.optionsMin) return;

    const optionsRoot = block.getInputTargetBlock("OPTIONS");
    const currentCount = optionsRoot ? getBlocksList(optionsRoot).length : 0;
    const missing = Math.max(0, commandDefinition.optionsMin - currentCount);

    if (missing == 0) return;
    setError(
        block,
        "CARDINALITY_MIN_OPTIONS",
        `Faltam opções obrigatórias (${missing}).`,
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

    const operandsRoot = block.getInputTargetBlock("OPERANDS");
    const currentCount = operandsRoot ? getBlocksList(operandsRoot).length : 0;
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

    const operandsRoot = block.getInputTargetBlock("OPERANDS");
    const allBlocks = operandsRoot ? getBlocksList(operandsRoot) : [];

    for (const operandDef of commandDefinition.operands) {
        const operandType = `${commandDefinition.id}_${operandDef.name}_operand`;
        const count = allBlocks.filter(
            (block) => block.type === operandType,
        ).length;
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
