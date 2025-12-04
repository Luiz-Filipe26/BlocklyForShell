import * as Blockly from "blockly/core";
import { BlockSvg } from "blockly/core";
import type { CLIControl } from "../types/cli";
import { setBlockSemanticData } from "./metadataManager";
import { createCardinalityField } from "./blockBuilders";

export function createControlBlock(controlDefinition: CLIControl) {
    Blockly.Blocks[controlDefinition.name] = {
        init: function(this: BlockSvg) {
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
