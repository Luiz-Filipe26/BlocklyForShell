import * as Blockly from "blockly";
import * as CLI from "@/types/cli";
import { setBlockSemanticData } from "@/blockly/serialization/metadataManager";

export function createOperatorBlock(operatorDefinition: CLI.CLIOperator): void {
    Blockly.Blocks[operatorDefinition.name] = {
        init: function(this: Blockly.BlockSvg) {
            setBlockSemanticData(this, {
                nodeType: "operator",
                commandName: operatorDefinition.id,
            });

            this.appendStatementInput("A")
                .setCheck("command")
                .appendField("Comando");

            this.appendDummyInput().appendField(operatorDefinition.command);

            this.appendStatementInput("B").setCheck("command");

            this.setPreviousStatement(true, "command");
            this.setNextStatement(true, "command");
            this.setColour(operatorDefinition.color);
            this.setTooltip(operatorDefinition.description);

            this.setInputsInline(true);
        },
    };
}
