import * as Blockly from "blockly";

const ORPHAN_DISABLED_REASON = "orphan_block";

/**
 * Verifica todos os blocos no workspace.
 * Se um bloco não estiver conectado (direta ou indiretamente) ao 'script_root',
 * ele é desabilitado (fica cinza e não gera código).
 */
export function disableOrphanBlocks(workspace: Blockly.WorkspaceSvg): void {
    workspace.addChangeListener(function(event) {
        // Ignora eventos de UI para performance
        if (event.isUiEvent) return;

        const rootBlocks = workspace.getTopBlocks(false);
        let scriptRoot: Blockly.Block | null = null;

        for (const block of rootBlocks) {
            if (block.type === "script_root") {
                scriptRoot = block;
                break;
            }
        }

        if (!scriptRoot) return;

        const allBlocks = workspace.getAllBlocks(false);

        for (const block of allBlocks) {
            // Se for um marcador de inserção (bloco fantasma), ignora.
            if (block.isInsertionMarker()) {
                continue;
            }

            if (block === scriptRoot) {
                // O bloco raiz nunca é órfão
                block.setDisabledReason(false, ORPHAN_DISABLED_REASON);
                continue;
            }

            const root = block.getRootBlock();
            const isOrphan = root !== scriptRoot;

            // Desabilita o bloco se for órfão, habilita caso contrário
            block.setDisabledReason(isOrphan, ORPHAN_DISABLED_REASON);
        }
    });
}
