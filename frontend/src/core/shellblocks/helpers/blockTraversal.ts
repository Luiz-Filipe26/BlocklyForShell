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

/**
 * Opções de filtragem para a listagem de blocos.
 */
export interface BlockFilterOptions {
    type?: string;
    predicate?: (block: Blockly.Block) => boolean;
}

/**
 * Percorre a sequência de blocos (next) e retorna uma lista filtrada.
 */
export function getBlocksList(
    firstBlock: Blockly.Block | null,
    filter?: BlockFilterOptions,
): Blockly.Block[] {
    const blocks: Blockly.Block[] = [];

    for (
        let current: Blockly.Block | null = firstBlock;
        current;
        current = current.getNextBlock()
    ) {
        if (filter) {
            if (filter.type && current.type !== filter.type) {
                continue;
            }
            if (filter.predicate && !filter.predicate(current)) {
                continue;
            }
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
