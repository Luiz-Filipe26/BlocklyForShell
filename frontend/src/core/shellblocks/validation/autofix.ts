import * as Blockly from "blockly";
import * as BlockIDs from "../constants/blockIds";
import * as CLI from "../types/cli";
import * as BlockTraversal from "../helpers/blockTraversal";
import { showToast } from "../ui/toast";
import { LogLevel } from "../types/logger";
import { coreLog } from "../services/logging";

/**
 * Despluga blocos de opção duplicados
 */
export function unplugDuplicatesFromList(
    blocks: Blockly.Block[],
    valueFn: (block: Blockly.Block) => string,
): void {
    const seen = new Set<string>();
    const workspace = BlockTraversal.getWorkspaceFromBlocks(blocks);

    for (const block of blocks) {
        const value = valueFn(block);
        if (seen.has(value)) {
            block.unplug(true);
            const message = `Opção "${value}" removida por duplicata`;
            if (workspace) {
                showToast(workspace, message, LogLevel.WARN);
                coreLog(workspace, message, LogLevel.WARN);
            }
            return;
        }
        seen.add(value);
    }
}

export function unplugExclusiveOptionsFromCommand(
    blocks: Blockly.Block[],
    exclusiveGroups: string[][],
): void {
    if (!exclusiveGroups || exclusiveGroups.length === 0) return;

    const remainingBlocks = [...blocks];

    for (const group of exclusiveGroups) {
        resolveGroupConflicts(group, remainingBlocks);
    }
}

function resolveGroupConflicts(
    group: string[],
    remainingBlocks: Blockly.Block[],
): void {
    const workspace = BlockTraversal.getWorkspaceFromBlocks(remainingBlocks);

    while (true) {
        const foundBlocks = findGroupBlocks(remainingBlocks, group);
        if (foundBlocks.length <= 1) return;

        const keeper = foundBlocks[0];
        const intruder = foundBlocks[1];

        const keeperFlag = String(keeper.getFieldValue(BlockIDs.FIELDS.FLAG));
        const intruderFlag = String(
            intruder.getFieldValue(BlockIDs.FIELDS.FLAG),
        );

        unplugAndTrim(intruder, remainingBlocks);

        const message = `Conflito: A opção \"${intruderFlag}\" não pode ser usada com \"${keeperFlag}\".`;
        if (workspace) {
            showToast(workspace, message);
            coreLog(workspace, message, LogLevel.WARN);
        }
    }
}

function findGroupBlocks(
    blocks: Blockly.Block[],
    group: string[],
): Blockly.Block[] {
    return blocks.filter((block) =>
        group.includes(String(block.getFieldValue(BlockIDs.FIELDS.FLAG))),
    );
}

function unplugAndTrim(
    block: Blockly.Block,
    remainingBlocks: Blockly.Block[],
): void {
    block.unplug(true);
    const idx = remainingBlocks.indexOf(block);
    if (idx === -1) return;
    remainingBlocks.splice(idx, remainingBlocks.length - idx);
}

/**
 * Remoção de excesso de operands
 */
export function autoFixExcessOperands(
    commandBlock: Blockly.BlockSvg,
    commandDefinition: CLI.CLICommand,
): void {
    const allBlocks = BlockTraversal.getBlocksList(
        commandBlock.getInputTargetBlock(BlockIDs.INPUTS.OPERANDS),
    );

    if (allBlocks.length === 0) return;

    const workspace = BlockTraversal.getWorkspaceFromBlocks(allBlocks);

    const blocksByType = new Map<string, Blockly.Block[]>();
    for (const block of allBlocks) {
        const list = blocksByType.get(block.type);
        if (list) {
            list.push(block);
        } else {
            blocksByType.set(block.type, [block]);
        }
    }

    for (const operandDef of commandDefinition.operands) {
        const max = operandDef.cardinality?.max ?? 0;
        if (max === "unlimited") continue;
        const operandType = BlockIDs.commandOperandBlockType(
            commandDefinition,
            operandDef,
        );
        const blocksOfType = blocksByType.get(operandType);
        if (!blocksOfType || blocksOfType.length <= max) continue;
        blocksOfType.slice(max).forEach((block) => block.unplug(true));

        const message = `Limite de ${max} excedido para \"${operandDef.label}\".`;
        if (workspace) {
            showToast(workspace, message);
            coreLog(workspace, message, LogLevel.WARN);
        }
    }
}
