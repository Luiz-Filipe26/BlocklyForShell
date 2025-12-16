import * as Blockly from "blockly";
import { getBlockSemanticData } from "../serialization/metadataManager";
import * as BlockIDs from "../constants/blockIds";

export interface ErrorRecord {
    id: string;
    message: string;
}

export interface BlockErrorReport {
    blockId: string;
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
        if (errors.length === 0) continue;

        report.push({
            blockId: block.id,
            blockName: resolveBlockDisplayName(block),
            messages: errors.map((error) => error.message),
        });
    }

    return report;
}

/**
 * Helper para gerar um nome legível baseado na semântica do bloco.
 */
function resolveBlockDisplayName(block: Blockly.Block): string {
    const data = getBlockSemanticData(block);

    if (!data) return block.type;

    switch (data.nodeType) {
        case "command":
        case "control":
        case "operator":
            return `[${data.nodeType}] ${data.name}`;

        case "option":
            const flag = block.getFieldValue(BlockIDs.FIELDS.FLAG) || "?";
            return `[Opção] ${flag}`;

        case "operand":
            const value = block.getFieldValue(BlockIDs.FIELDS.VALUE) || "";
            return `[Operando: ${data.name}] "${value}"`;

        default:
            return block.type;
    }
}
