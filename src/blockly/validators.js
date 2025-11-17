import * as Blockly from "blockly";
import { showToast } from "./uiFeedback.js";

export function getBlocksList(firstBlock) {
    const blocks = [];
    for (let current = firstBlock; current; current = current.getNextBlock()) {
        blocks.push(current);
    }
    return blocks;
}

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
