import * as Blockly from "blockly";
import * as CLI from "@/types/cli";
import { setBlockSemanticData } from "@/blockly/serialization/metadataManager";
import * as BlockUtils from "./blockUtils"; // ✅ Import necessário

export function createOperatorBlock(operatorDefinition: CLI.CLIOperator): void {
    Blockly.Blocks[operatorDefinition.name] = {
        init: function(this: Blockly.BlockSvg) {
            setBlockSemanticData(this, {
                nodeType: "operator",
                commandName: operatorDefinition.id,
                slotsWithImplicitData: operatorDefinition.slotsWithImplicitData,
            });

            this.setInputsInline(true);

            const helpIcon = BlockUtils.createGenericHelpIcon(() => {
                return `
                    <div class="help-content">
                        <h3>Operador: ${operatorDefinition.command}</h3>
                        <p>${operatorDefinition.description}</p>
                    </div>
                `;
            });

            this.appendDummyInput()
                .appendField(operatorDefinition.name)
                .appendField(" ")
                .appendField(helpIcon);

            operatorDefinition.slots.forEach((slot) => {
                const input = this.appendStatementInput(slot.name).setCheck(
                    slot.check,
                );

                if (slot.symbol) {
                    if (slot.symbolPlacement === "before") {
                        input.appendField(slot.symbol);
                        if (slot.label) input.appendField(slot.label);
                    } else {
                        if (slot.label) input.appendField(slot.label);
                    }
                } else if (slot.label) {
                    input.appendField(slot.label);
                }
            });

            this.setPreviousStatement(true, "command");
            this.setNextStatement(true, "command");
            this.setColour(operatorDefinition.color);
            this.setTooltip(operatorDefinition.description);
        },
    };
}
