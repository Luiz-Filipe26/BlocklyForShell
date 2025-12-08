import * as Blockly from "blockly";
import * as CLI from "@/types/cli";
import { setBlockSemanticData } from "@/blockly/serialization/metadataManager";
import { createCardinalityField } from "./blockUtils";

export function createControlBlock(controlDefinition: CLI.CLIControl): void {
    Blockly.Blocks[controlDefinition.name] = {
        init: function(this: Blockly.BlockSvg) {
            setBlockSemanticData(this, {
                nodeType: "control",
                commandName: controlDefinition.name,
            });

            this.appendDummyInput()
                .appendField(controlDefinition.command)
                .appendField(createCardinalityField(20), "CARDINALITY_ICON");

            controlDefinition.slots.forEach((slot) => {
                this.appendStatementInput(slot.name)
                    .setCheck(slot.check)
                    .appendField(slot.label);
            });

            this.setPreviousStatement(true, "command");
            this.setNextStatement(true, "command");
            this.setColour(controlDefinition.color);
            this.setTooltip(controlDefinition.description);
        },
    };
}
