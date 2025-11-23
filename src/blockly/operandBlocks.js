// blockly/operandBlocks.js
import * as Blockly from "blockly/core";

import { validateOperandValue } from "./validators.js";

import { setupParentIndicator } from "./blockBuilders.js";

/* ============================================================
   INTERNAL HELPERS
   ============================================================ */

function buildOperandField(operandDefinition, block) {
    const textField = new Blockly.FieldTextInput(
        operandDefinition.defaultValue || "",
    );

    textField.setValidator((text) =>
        validateOperandValue(text, operandDefinition.validations, block),
    );

    return textField;
}

function appendOperandInputs(commandDefinition, operandDefinition, block) {
    const field = buildOperandField(operandDefinition, block);

    block
        .appendDummyInput("MAIN_INPUT")
        .appendField(
            `(operando de: ${commandDefinition.command})`,
            "PARENT_INDICATOR",
        )
        .appendField(`${operandDefinition.name}:`)
        .appendField(field, "VALUE");

    block.setPreviousStatement(true, `${commandDefinition.name}_Operand`);
    block.setNextStatement(true, `${commandDefinition.name}_Operand`);
    block.setColour(operandDefinition.color || commandDefinition.color);
    block.setTooltip(operandDefinition.description);
}

/* ============================================================
   BLOCK CREATION
   ============================================================ */

function createSingleOperandBlock(commandDefinition, operandDefinition) {
    const type = `${commandDefinition.name}_${operandDefinition.name}_operand`;

    Blockly.Blocks[type] = {
        init: function() {
            appendOperandInputs(commandDefinition, operandDefinition, this);

            setupParentIndicator(
                this,
                commandDefinition,
                `(operando de: ${commandDefinition.command})`,
            );
        },
    };
}

export function createOperandBlocks(commandDefinition) {
    for (const operandDef of commandDefinition.operands) {
        createSingleOperandBlock(commandDefinition, operandDef);
    }
}
