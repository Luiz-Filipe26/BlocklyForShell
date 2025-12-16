import * as Blockly from "blockly";
import { findScriptRoot } from "../blocks/systemBlocks";

const ORPHAN_DISABLED_REASON = "orphan_block";

/**
 * Verifica todos os blocos no workspace.
 * Se um bloco não estiver conectado (direta ou indiretamente) ao "script_root",
 * ele é desabilitado (fica cinza e não gera código).
 */
export function disableOrphanBlocks(workspace: Blockly.WorkspaceSvg): void {
    workspace.addChangeListener((event) => {
        if (event.isUiEvent) return;

        let scriptRoot = findScriptRoot(workspace);
        const allBlocks = workspace.getAllBlocks(false);

        for (const block of allBlocks) {
            if (block.isInsertionMarker()) continue;
            const root = block.getRootBlock();
            const shouldDisable = root !== scriptRoot;
            block.setDisabledReason(shouldDisable, ORPHAN_DISABLED_REASON);
        }
    });
}
