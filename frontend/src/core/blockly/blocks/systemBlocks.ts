import * as Blockly from "blockly";
import * as BlockIDs from "../constants/blockIds";
import { PATH_CONSTANTS } from "../constants/pathConstants";

export function findScriptRoot(
    workspace: Blockly.WorkspaceSvg,
): Blockly.Block | null {
    const roots = workspace.getBlocksByType(BlockIDs.ROOT_BLOCK_TYPE, false);
    return roots.length > 0 ? roots[0] : null;
}

export function initSystemBlocks(): void {
    Blockly.Blocks[BlockIDs.ROOT_BLOCK_TYPE] = {
        init: function(this: Blockly.Block) {
            this.appendDummyInput()
                .appendField(
                    new Blockly.FieldImage(
                        PATH_CONSTANTS.FILE_TEXT_WHITE_ICON,
                        24,
                        24,
                        "",
                    ),
                )
                .appendField("Script Principal");
            this.appendStatementInput(BlockIDs.INPUTS.STACK).setCheck(
                BlockIDs.commandStatementType(),
            );

            this.setColour("#333333");
            this.setTooltip(
                "Ponto de partida do seu script. Coloque os comandos aqui dentro.",
            );
            this.setDeletable(false);
            this.setMovable(true);
        },
    };
}
