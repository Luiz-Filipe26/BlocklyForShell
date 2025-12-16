import * as Blockly from "blockly";
import * as BlockIDs from "../constants/blockIds";
import { Assets } from "../constants/Assets";
import { setBlockSemanticData } from "../serialization/metadataManager";

export function findScriptRoot(
    workspace: Blockly.WorkspaceSvg,
): Blockly.Block | null {
    const roots = workspace.getBlocksByType(BlockIDs.ROOT_BLOCK_TYPE, false);
    return roots.length > 0 ? roots[0] : null;
}

export function initSystemBlocks(): void {
    Blockly.Blocks[BlockIDs.ROOT_BLOCK_TYPE] = {
        init: function(this: Blockly.Block) {
            setBlockSemanticData(this, {
                nodeType: "script",
                name: "script",
                bindings: [
                    {
                        key: "commands",
                        source: "input",
                        name: BlockIDs.INPUTS.STACK,
                    },
                ],
            });
            this.appendDummyInput()
                .appendField(
                    new Blockly.FieldImage(
                        Assets.Icons.FileText,
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
