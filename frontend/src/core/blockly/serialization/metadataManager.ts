import * as Blockly from "blockly";
import type { SemanticData } from "@/types/ast";

const semanticDataMap = new WeakMap<Blockly.Block, SemanticData>();

export function setBlockSemanticData(
    block: Blockly.Block,
    data: SemanticData,
): void {
    semanticDataMap.set(block, data);
}

export function getBlockSemanticData(
    block: Blockly.Block,
): SemanticData | undefined {
    return semanticDataMap.get(block);
}
