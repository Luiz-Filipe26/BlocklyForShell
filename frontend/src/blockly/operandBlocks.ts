import * as Blockly from "blockly/core";
import { validateOperandValue } from "./validators";
import { setupParentIndicator } from "./blockBuilders";
import type { CLICommand, CLIOperand } from "../types/cli";
import type * as AST from "../types/ast";

/* ============================================================
   INTERNAL HELPERS
   ============================================================ */

function buildOperandField(
    operandDefinition: CLIOperand,
    block: Blockly.Block,
): Blockly.FieldTextInput {
    const textField = new Blockly.FieldTextInput(
        operandDefinition.defaultValue || "",
    );

    textField.setValidator((text: string): string | null =>
        validateOperandValue(text, operandDefinition.validations, block),
    );

    return textField;
}

function appendOperandInputs(
    commandDefinition: CLICommand,
    operandDefinition: CLIOperand,
    block: Blockly.Block,
): void {
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

function createSingleOperandBlock(
    commandDefinition: CLICommand,
    operandDefinition: CLIOperand,
): void {
    const type = `${commandDefinition.name}_${operandDefinition.name}_operand`;

    Blockly.Blocks[type] = {
        init: function (this: Blockly.Block) {
            const block = this as Blockly.Block & { semanticData: AST.BlockSemanticData };
            block.semanticData = {
                nodeType: "operand",
                operandName: operandDefinition.name,
                operandType: operandDefinition.type,
                relatedCommand: commandDefinition.command,
            };
            appendOperandInputs(commandDefinition, operandDefinition, this);

            setupParentIndicator(
                this,
                commandDefinition,
                `(operando de: ${commandDefinition.command})`,
            );
        },
    };
}

export function createOperandBlocks(commandDefinition: CLICommand): void {
    if (
        !commandDefinition.operands ||
        commandDefinition.operands.length === 0
    ) {
        return;
    }

    for (const operandDef of commandDefinition.operands) {
        createSingleOperandBlock(commandDefinition, operandDef);
    }
}
