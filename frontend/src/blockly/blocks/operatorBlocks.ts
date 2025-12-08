import * as Blockly from "blockly";
import * as CLI from "@/types/cli";
import { setBlockSemanticData } from "@/blockly/serialization/metadataManager";

export function createOperatorBlock(operatorDefinition: CLI.CLIOperator): void {
    Blockly.Blocks[operatorDefinition.name] = {
        init: function(this: Blockly.BlockSvg) {
            setBlockSemanticData(this, {
                nodeType: "operator",
                commandName: operatorDefinition.id,
                slotsWithImplicitData: operatorDefinition.slotsWithImplicitData,
            });

            this.setInputsInline(true);

            for (const slot of operatorDefinition.slots) {
                const input = this.appendStatementInput(slot.name).setCheck(
                    slot.check,
                );

                if (slot.symbol) {
                    if (slot.symbolPlacement === "before") {
                        input.appendField(slot.symbol);
                        if (slot.label) input.appendField(slot.label);
                    } else {
                        if (slot.label) input.appendField(slot.label);
                        // Nota: No Blockly statement, appendField vai sempre à esquerda visualmente
                        // Se precisar ser estritamente à direita, seria necessário um DummyInput extra.
                        // Por enquanto, assumimos que labels/symbols ficam à esquerda do buraco.
                    }
                } else if (slot.label) {
                    input.appendField(slot.label);
                }
            }

            this.setPreviousStatement(true, "command");
            this.setNextStatement(true, "command");
            this.setColour(operatorDefinition.color);
            this.setTooltip(operatorDefinition.description);
        },
    };
}
