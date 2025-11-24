// validators.js
import * as Blockly from "blockly";
import { showToast } from "./uiFeedback.js";

/* ============================================
   LISTA DE BLOCOS EM LINHA
   ============================================ */
export function getBlocksList(firstBlock) {
    const blocks = [];
    for (let curr = firstBlock; curr; curr = curr.getNextBlock()) {
        blocks.push(curr);
    }
    return blocks;
}

/* ============================================
   DUPLICATAS (options)
   ============================================ */
export function unplugDuplicatesFromList(workspace, blocks, valueFn) {
    const seen = new Set();
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

/* ============================================
   VALIDAÇÃO DE REGEX (operandos)
   ============================================ */
export function validateOperandValue(text, rules, block) {
    for (const rule of rules) {
        const regex = new RegExp(rule.regex);

        if (!regex.test(text)) {
            block.setWarningText(rule.errorMessage);
            return null;
        }
    }

    block.setWarningText(null);
    return text;
}

/* ============================================
   COLETA DE PROBLEMAS DE CARDINALIDADE
   ============================================ */
export function collectCardinalityProblems(commandBlock, commandDefinition) {
    const problems = {
        optionsMinMissing: 0,
        operandsMinMissing: 0,
        missingOperands: [],
    };

    const optionsRootBlock = commandBlock.getInputTargetBlock("OPTIONS");
    const operandsRoot = commandBlock.getInputTargetBlock("OPERANDS");

    if (commandDefinition.optionsMin != null) {
        const optionBlocks = optionsRootBlock
            ? getBlocksList(optionsRootBlock)
            : [];
        const missing = Math.max(
            0,
            commandDefinition.optionsMin - optionBlocks.length,
        );
        problems.optionsMinMissing = missing;
    }

    if (commandDefinition.operandsMin != null) {
        const operandBlocks = operandsRoot ? getBlocksList(operandsRoot) : [];
        const missing = Math.max(
            0,
            commandDefinition.operandsMin - operandBlocks.length,
        );
        problems.operandsMinMissing = missing;
    }

    for (const operandDefinition of commandDefinition.operands) {
        const operandType = `${commandDefinition.name}_${operandDefinition.name}_operand`;

        const operandBlocksOfType = operandsRoot
            ? getBlocksList(opRoot).filter((b) => b.type === operandType)
            : [];

        const count = operandBlocksOfType.length;
        const min = operandDefinition.cardinality?.min ?? 0;

        const missing = Math.max(0, min - count);

        if (missing > 0) {
            problems.missingOperands.push({
                name: operandDefinition.name,
                amount: missing,
            });
        }
    }

    return problems;
}

/* ============================================
   REMOÇÃO DE EXCESSO DE OPERANDS
   ============================================ */
export function autoFixExcessOperands(commandBlock, commandDefinition) {
    const operandsRoot = commandBlock.getInputTargetBlock("OPERANDS");
    if (!operandsRoot) return;

    const allBlocks = getBlocksList(operandsRoot);

    for (const operandDef of commandDefinition.operands) {
        const max = operandDef.cardinality?.max;
        if (typeof max !== 'number') continue;

        const operandType = `${commandDefinition.name}_${operandDef.name}_operand`;
        const blocksOfType = allBlocks.filter(b => b.type === operandType);

        if (blocksOfType.length > max) {
            blocksOfType.slice(max).forEach(block => block.unplug(true));
            showToast(
                commandBlock.workspace, 
                `Limite de ${max} excedido para '${operandDef.name}'.`
            );
        }
    }
}

export function checkAndFixExclusiveOptions(workspace, blocks, exclusiveGroups) {
    if (!exclusiveGroups || exclusiveGroups.length === 0) return;

    for (const group of exclusiveGroups) {
        const foundBlocks = blocks.filter(block => 
            group.includes(block.getFieldValue("FLAG"))
        );

        if (foundBlocks.length > 1) {
            const blockToRemove = foundBlocks[foundBlocks.length - 1];
            const flagToRemove = blockToRemove.getFieldValue("FLAG");
            const conflictWith = foundBlocks[0].getFieldValue("FLAG");

            blockToRemove.unplug(true);
            showToast(
                workspace, 
                `Conflito: A opção '${flagToRemove}' não pode ser usada com '${conflictWith}'.`
            );
            return;
        }
    }
}
