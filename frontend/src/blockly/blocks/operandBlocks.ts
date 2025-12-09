import * as Blockly from "blockly";
import { validateOperandValue } from "@/blockly/validation/valueValidators";
import { setupParentIndicator } from "./blockUtils";
import * as CLI from "@/types/cli";
import { setBlockSemanticData } from "@/blockly/serialization/metadataManager";
import { renderBlockWarnings } from "@/blockly/validation/validationWarnings";

export function createOperandBlocks(commandDefinition: CLI.CLICommand): void {
    if (!commandDefinition.operands || commandDefinition.operands.length === 0)
        return;

    for (const operandDef of commandDefinition.operands) {
        createSingleOperandBlock(commandDefinition, operandDef);
    }
}

function createSingleOperandBlock(
    commandDefinition: CLI.CLICommand,
    operandDefinition: CLI.CLIOperand,
): void {
    Blockly.Blocks[
        `${commandDefinition.id}_${operandDefinition.id}_operand`
    ] = {
        init: function(this: Blockly.Block) {
            setBlockSemanticData(this, {
                nodeType: "operand",
                operandName: operandDefinition.id,
                operandType: operandDefinition.type,
                relatedCommand: commandDefinition.shellCommand,
            });
            appendOperandInputs(commandDefinition, operandDefinition, this);

            setupParentIndicator(
                this,
                commandDefinition,
                `(operando de: ${commandDefinition.shellCommand})`,
            );
        },
    };
}

function appendOperandInputs(
    commandDefinition: CLI.CLICommand,
    operandDefinition: CLI.CLIOperand,
    block: Blockly.Block,
): void {
    const field = buildOperandField(operandDefinition, block);

    block
        .appendDummyInput("MAIN_INPUT")
        .appendField(
            `(operando de: ${commandDefinition.shellCommand})`,
            "PARENT_INDICATOR",
        )
        .appendField(`${operandDefinition.label}:`)
        .appendField(field, "VALUE");

    block.setPreviousStatement(true, `${commandDefinition.id}_Operand`);
    block.setNextStatement(true, `${commandDefinition.id}_Operand`);
    block.setColour(operandDefinition.color || commandDefinition.color);
    block.setTooltip(operandDefinition.description);
}

function buildOperandField(
    operandDefinition: CLI.CLIOperand,
    block: Blockly.Block,
): Blockly.FieldTextInput {
    const textField = new Blockly.FieldTextInput(
        operandDefinition.defaultValue || "",
    );

    textField.setValidator((newValue) => {
        validateOperandValue(newValue, operandDefinition.validations, block);
        renderBlockWarnings(block);
        return newValue;
    });

    return textField;
}
