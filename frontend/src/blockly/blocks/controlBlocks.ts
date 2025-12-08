import * as Blockly from "blockly";
import * as CLI from "@/types/cli";
import { setBlockSemanticData } from "@/blockly/serialization/metadataManager";
import { validateControlCardinality } from "@/blockly/validation/cardinalityValidator";
import { renderBlockWarnings } from "@/blockly/validation/validationWarnings";
import * as BlockUtils from "./blockUtils";

export function createControlBlock(controlDefinition: CLI.CLIControl): void {
    Blockly.Blocks[controlDefinition.name] = {
        init: function(this: Blockly.BlockSvg) {
            setBlockSemanticData(this, {
                nodeType: "control",
                commandName: controlDefinition.id,
            });

            controlDefinition.slots.forEach((slot) => {
                const input = this.appendStatementInput(slot.name).setCheck(
                    slot.check,
                );

                if (slot.label) {
                    input.appendField(slot.label);
                }
            });

            this.setPreviousStatement(true, "command");
            this.setNextStatement(true, "command");
            this.setColour(controlDefinition.color);
            this.setTooltip(controlDefinition.description);

            BlockUtils.addLocalChangeListener(this, () => {
                validateControlCardinality(this, controlDefinition);
                renderBlockWarnings(this);
            });
        },
    };
}
