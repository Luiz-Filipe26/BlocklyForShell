import * as Blockly from "blockly/core";
import { BlockSvg } from "blockly/core";
import type { CLIOperator } from "../types/cli";
import { setBlockSemanticData } from "./metadataManager";

export function createOperatorBlock(operatorDefinition: CLIOperator) {
    Blockly.Blocks[operatorDefinition.name] = {
        init: function (this: BlockSvg) {
            setBlockSemanticData(this, {
                nodeType: "operator",
                commandName: operatorDefinition.id,
            });

            this.appendStatementInput("A")
                .setCheck("command")
                .appendField("Comando");

            this.appendDummyInput()
                .appendField(operatorDefinition.command);

            this.appendStatementInput("B")
                .setCheck("command");

            this.setPreviousStatement(true, "command");
            this.setNextStatement(true, "command");
            this.setColour(operatorDefinition.color);
            this.setTooltip(operatorDefinition.description);

            this.setInputsInline(true);
        },
    };
}
