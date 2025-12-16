import * as Blockly from "blockly";

/**
 * Obtém o WorkspaceSvg a partir do primeiro bloco existente na lista de argumentos.
 */
export function getWorkspaceFromBlocks(
    blocks: Blockly.Block | Blockly.Block[],
): Blockly.WorkspaceSvg | null {
    const blocksArray = blocks instanceof Array ? blocks : [blocks];
    if (blocksArray.length === 0) return null;
    const firstBlock = blocksArray.find((block) => block.workspace);
    if (firstBlock?.workspace instanceof Blockly.WorkspaceSvg)
        return firstBlock.workspace;
    return null;
}

export function getBlocksList(
    firstBlock: Blockly.Block | null,
    filter?: string | ((block: Blockly.Block) => boolean),
): Blockly.Block[] {
    const blocks: Blockly.Block[] = [];

    for (
        let current: Blockly.Block | null = firstBlock;
        current;
        current = current.getNextBlock()
    ) {
        if (typeof filter === "string") {
            if (current.type !== filter) continue;
        } else if (typeof filter === "function") {
            if (!filter(current)) continue;
        }
        blocks.push(current);
    }
    return blocks;
}

export function getParentInputName(block: Blockly.Block): string | null {
    const connection = block.previousConnection;
    if (!connection || !connection.targetConnection) return null;
    const parentInput = connection.targetConnection.getParentInput();
    return parentInput?.name ?? null;
}
