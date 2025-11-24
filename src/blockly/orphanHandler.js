import * as Blockly from "blockly/core";

/**
 * Verifica todos os blocos no workspace.
 * Se um bloco não estiver conectado (direta ou indiretamente) ao 'script_root',
 * ele é desabilitado (fica cinza e não gera código).
 */
export function disableOrphanBlocks(workspace) {
    workspace.addChangeListener(function(event) {
        // 1. Ignora eventos de UI para performance
        if (event.type === Blockly.Events.UI) return;

        // 2. Ignora eventos de criação/deleção de marcadores (evita loops infinitos e erros)
        if (event.type === Blockly.Events.MARKER_MOVE) return;

        const rootBlocks = workspace.getTopBlocks(false);
        let scriptRoot = null;

        for (const block of rootBlocks) {
            if (block.type === "script_root") {
                scriptRoot = block;
                break;
            }
        }

        if (!scriptRoot) return;

        const allBlocks = workspace.getAllBlocks(false);

        for (const block of allBlocks) {
            // --- PROTEÇÃO CONTRA O ERRO ---

            // 1. Se for um marcador de inserção (bloco fantasma), ignora.
            if (block.isInsertionMarker && block.isInsertionMarker()) {
                continue;
            }

            // 2. Se o bloco não tiver o método setEnabled por algum motivo bizarro, ignora.
            if (typeof block.setEnabled !== "function") {
                continue;
            }
            // ------------------------------

            if (block === scriptRoot) {
                block.setEnabled(true);
                continue;
            }

            const root = block.getRootBlock();

            if (root === scriptRoot) {
                block.setEnabled(true);
            } else {
                block.setEnabled(false);
            }
        }
    });
}
