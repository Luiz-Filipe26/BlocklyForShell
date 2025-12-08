import * as Blockly from "blockly";

export interface ErrorRecord {
    id: string;
    message: string;
}

export interface BlockErrorReport {
    blockName: string;
    messages: string[];
}

const blockErrorsMap = new WeakMap<Blockly.Block, ErrorRecord[]>();

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
    if (!errors) return;
    const index = errors.findIndex((error) => error.id === errorId);
    if (index < 0) return;
    errors.splice(index, 1);
}

export function getErrors(block: Blockly.Block): ErrorRecord[] {
    return blockErrorsMap.get(block) || [];
}

/**
 * Itera sobre o workspace para encontrar todos os blocos com erros registrados.
 */
export function getWorkspaceErrors(
    workspace: Blockly.WorkspaceSvg,
): BlockErrorReport[] {
    const report: BlockErrorReport[] = [];
    for (const block of workspace.getAllBlocks(false)) {
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
