import * as Blockly from "blockly";
import { showToast } from "./uiFeedback";
import type { CLIValidation, CLICommand } from "../types/cli";
import { clearError, getErrors, setError } from "./validationManager";
import { getBlockSemanticData } from "./metadataManager";

/**
 * Lista blocos em linha
 */
export function getBlocksList(firstBlock: Blockly.Block): Blockly.Block[] {
    const blocks: Blockly.Block[] = [];
    for (
        let current: Blockly.Block | null = firstBlock;
        current;
        current = current.getNextBlock()
    ) {
        blocks.push(current);
    }
    return blocks;
}

/**
 * Despluga blocos de opção duplicados
 */
export function unplugDuplicatesFromList(
    workspace: Blockly.WorkspaceSvg,
    blocks: Blockly.Block[],
    valueFn: (block: Blockly.Block) => string,
): void {
    const seen = new Set<string>();
    for (const block of blocks) {
        const value = valueFn(block);
        if (seen.has(value)) {
            block.unplug(true);
            showToast(workspace, `Opção "${value}" removida por duplicata`);
            return;
        }
        seen.add(value);
    }
}

/**
 * Renderiza os erros no bloco com formatação rica e ordenação.
 */
export function renderBlockWarnings(block: Blockly.Block): void {
    const errors = getErrors(block);

    if (errors.length === 0) {
        block.setWarningText(null);
        return;
    }

    const lines: string[] = [];

    const cardSpecificOperands = errors.filter((error) =>
        error.id.startsWith("CARDINALITY_MISSING_OPERAND_"),
    );
    const cardMinOperands = errors.find(
        (error) => error.id === "CARDINALITY_MIN_OPERANDS",
    );
    const cardMinOptions = errors.find(
        (error) => error.id === "CARDINALITY_MIN_OPTIONS",
    );

    if (cardSpecificOperands.length > 0) {
        lines.push("🔴 Faltam operandos específicos:");
        cardSpecificOperands.forEach((error) => {
            const cleanMsg = error.message.replace("Falta operando: ", "");
            lines.push(`    • ${cleanMsg}`);
        });
    }

    if (cardMinOperands) lines.push(`🔴 ${cardMinOperands.message}`);

    if (cardMinOptions) lines.push(`🔴 ${cardMinOptions.message}`);

    const otherErrors = errors.filter((e) => !e.id.startsWith("CARDINALITY_"));

    if (otherErrors.length > 0) {
        if (lines.length > 0) lines.push("────────────────");

        otherErrors.forEach((err) => {
            lines.push(`⚠️ ${err.message}`);
        });
    }

    block.setWarningText(lines.join("\n"));
}

/**
 * Faz a validação de regex dos operandos
 */
export function validateOperandValue(
    text: string,
    rules: CLIValidation[],
    block: Blockly.Block,
): void {
    rules.forEach((rule, index) => {
        const ruleErrorId = `OPERAND_REGEX_${index}`;
        const regex = new RegExp(rule.regex);

        if (!regex.test(text)) {
            setError(block, ruleErrorId, rule.errorMessage);
        } else {
            clearError(block, ruleErrorId);
        }
    });
}

/**
 * Executa a Validação de Cardinalidade mínima e registra Erros de Falta de Componentes"
 */
export function validateCardinality(
    commandBlock: Blockly.Block,
    commandDefinition: CLICommand,
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
    commandDefinition: CLICommand,
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
    commandDefinition: CLICommand,
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
    commandDefinition: CLICommand,
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
    commandDefinition: CLICommand,
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

/**
 * Remoção de excesso de operands
 */
export function autoFixExcessOperands(
    commandBlock: Blockly.BlockSvg,
    commandDefinition: CLICommand,
): void {
    const operandsRoot = commandBlock.getInputTargetBlock("OPERANDS");
    if (!operandsRoot) return;

    const allBlocks = getBlocksList(operandsRoot);

    for (const operandDef of commandDefinition.operands) {
        const max = operandDef.cardinality?.max ?? 0;
        if (max == "unlimited") continue;

        const operandType = `${commandDefinition.id}_${operandDef.name}_operand`;
        const blocksOfType = allBlocks.filter((b) => b.type === operandType);

        if (blocksOfType.length <= max) continue;
        blocksOfType.slice(max).forEach((block) => block.unplug(true));
        showToast(
            commandBlock.workspace,
            `Limite de ${max} excedido para '${operandDef.name}'.`,
        );
    }
}

export function checkAndFixExclusiveOptions(
    workspace: Blockly.WorkspaceSvg,
    blocks: Blockly.Block[],
    exclusiveGroups: string[][],
): void {
    if (!exclusiveGroups || exclusiveGroups.length === 0) return;

    for (const group of exclusiveGroups) {
        const foundBlocks = blocks.filter((block) =>
            group.includes(block.getFieldValue("FLAG")),
        );

        if (foundBlocks.length == 0) continue;
        const blockToRemove = foundBlocks[foundBlocks.length - 1];
        const flagToRemove = blockToRemove.getFieldValue("FLAG");
        const conflictWith = foundBlocks[0].getFieldValue("FLAG");

        blockToRemove.unplug(true);
        showToast(
            workspace,
            `Conflito: A opção '${flagToRemove}' não pode ser usada com '${conflictWith}'.`,
        );
        return;
    }
}
