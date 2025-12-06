import * as Blockly from "blockly";

export interface BlockError {
    id: string;
    message: string;
}

const blockErrorsMap = new WeakMap<Blockly.Block, BlockError[]>();

export function setError(
    block: Blockly.Block,
    errorId: string,
    message: string,
): void {
    let errors = blockErrorsMap.get(block) ?? [];
    errors = [
        ...errors.filter((e) => e.id !== errorId),
        { id: errorId, message },
    ];
    blockErrorsMap.set(block, errors);
}

export function clearError(block: Blockly.Block, errorId: string): void {
    const errors = blockErrorsMap.get(block);
    errors?.splice(
        errors.findIndex((error) => error.id === errorId),
        1,
    );
}

export function getErrors(block: Blockly.Block): BlockError[] {
    return blockErrorsMap.get(block) || [];
}

/**
 * Itera sobre o workspace para encontrar todos os blocos com erros registrados.
 */
export function getWorkspaceErrors(
    workspace: Blockly.WorkspaceSvg,
): Array<{ blockName: string; messages: string[] }> {
    const report: Array<{ blockName: string; messages: string[] }> = [];
    const allBlocks = workspace.getAllBlocks(false);
    for (const block of allBlocks) {
        if (!block.isEnabled()) continue;
        const errors = getErrors(block);
        if (errors.length == 0) continue;
        const blockName =
            block.getField("FLAG")?.getValue() ||
            block.getField("VALUE")?.getValue() ||
            block.type;

        report.push({
            blockName: blockName,
            messages: errors.map((e) => e.message),
        });
    }

    return report;
}
