import * as Blockly from "blockly";
import * as Logger from "@/app/systemLogger";
import * as CLI from "@/types/cli";
import { getBlocksList } from "@/blockly/blocks/blockUtils";

/**
 * Despluga blocos de opção duplicados
 */
export function unplugDuplicatesFromList(
    blocks: Blockly.Block[],
    valueFn: (block: Blockly.Block) => string,
): void {
    const seen = new Set<string>();
    for (const block of blocks) {
        const value = valueFn(block);
        if (seen.has(value)) {
            block.unplug(true);
            Logger.log(
                `Opção "${value}" removida por duplicata`,
                Logger.LogLevel.WARN,
                Logger.LogMode.ToastAndConsole,
            );
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

    for (const group of exclusiveGroups) {
        const foundBlocks = blocks.filter((block) =>
            group.includes(block.getFieldValue("FLAG")),
        );

        if (foundBlocks.length == 0) continue;
        const blockToRemove = foundBlocks[foundBlocks.length - 1];
        const flagToRemove = blockToRemove.getFieldValue("FLAG");
        const conflictWith = foundBlocks[0].getFieldValue("FLAG");

        blockToRemove.unplug(true);
        Logger.log(
            `Conflito: A opção '${flagToRemove}' não pode ser usada com '${conflictWith}'.`,
            Logger.LogLevel.WARN,
            Logger.LogMode.ToastAndConsole,
        );
        return;
    }
}

/**
 * Remoção de excesso de operands
 */
export function autoFixExcessOperands(
    commandBlock: Blockly.BlockSvg,
    commandDefinition: CLI.CLICommand,
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
        Logger.log(
            `Limite de ${max} excedido para '${operandDef.name}'.`,
            Logger.LogLevel.WARN,
            Logger.LogMode.ToastAndConsole,
        );
    }
}
