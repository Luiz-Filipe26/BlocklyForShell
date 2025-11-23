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
   REMOÇÃO DE EXCESSO DE OPERANDS (opcional)
   ============================================ */
export function autoFixExcessOperands(commandBlock, commandDefinition) {
    const opRoot = commandBlock.getInputTargetBlock("OPERANDS");
    if (!opRoot) return;

    for (const operandDefinition of commandDefinition.operands) {
        const operandType = `${commandDefinition.name}_${operandDefinition.name}_operand`;

        const blocks = getBlocksList(opRoot).filter((b) => b.type === operandType);

        const max =
            operandDefinition.cardinality?.max === "unlimited"
                ? Infinity
                : (operandDefinition.cardinality?.max ?? Infinity);

        if (blocks.length > max) {
            const excess = blocks.length - max;

            for (let i = 0; i < excess; i++) {
                const b = blocks.pop();
                if (b) b.unplug(true);
            }

            showToast(
                commandBlock.workspace,
                `Operando '${operandDefinition.name}' removido (máximo permitido = ${max}).`,
            );
        }
    }
}
