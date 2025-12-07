import * as Blockly from "blockly";
import type { BlockSemanticData } from "../types/ast";

// O WeakMap segura os dados sem impedir que o Garbage Collector limpe a memória
// quando o bloco for deletado do workspace.
const semanticDataMap = new WeakMap<Blockly.Block, BlockSemanticData>();

export function setBlockSemanticData(
    block: Blockly.Block,
    data: BlockSemanticData,
): void {
    semanticDataMap.set(block, data);
}

export function getBlockSemanticData(
    block: Blockly.Block,
): BlockSemanticData | undefined {
    return semanticDataMap.get(block);
}
