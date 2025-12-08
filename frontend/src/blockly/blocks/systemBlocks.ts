import * as Blockly from "blockly";

export const SCRIPT_ROOT_BLOCK_TYPE = "script_root";

export function findScriptRoot(
    workspace: Blockly.WorkspaceSvg,
): Blockly.Block | null {
    const roots = workspace.getBlocksByType(SCRIPT_ROOT_BLOCK_TYPE, false);
    return roots.length > 0 ? roots[0] : null;
}

export function initSystemBlocks(): void {
    Blockly.Blocks[SCRIPT_ROOT_BLOCK_TYPE] = {
        init: function(this: Blockly.Block) {
            this.appendDummyInput().appendField("📜 Script Principal");
            this.appendStatementInput("STACK").setCheck("command");

            this.setColour("#333333");
            this.setTooltip(
                "Ponto de partida do seu script. Coloque os comandos aqui dentro.",
            );
            this.setDeletable(false);
            this.setMovable(true);
        },
    };
}
