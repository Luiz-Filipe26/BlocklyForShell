import * as Blockly from "blockly";
import * as BlockIDs from "../constants/blockIds";
import { validateOperandValue } from "../validation/valueValidators";
import * as BlockComponents from "../ui/blockComponents";
import * as CLI from "@/types/cli";
import { setBlockSemanticData } from "../serialization/metadataManager";
import { renderBlockWarnings } from "../validation/validationWarnings";

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
        BlockIDs.commandOperandBlockType(commandDefinition, operandDefinition)
    ] = {
        init: function(this: Blockly.Block) {
            setBlockSemanticData(this, {
                nodeType: "operand",
                name: operandDefinition.id,
                bindings: [
                    {
                        key: "value",
                        source: "field",
                        name: BlockIDs.FIELDS.VALUE,
                    },
                ],
            });
            appendOperandInputs(commandDefinition, operandDefinition, this);

            BlockComponents.setupParentIndicator(
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
        .appendDummyInput(BlockIDs.FIELDS.MAIN_INPUT)
        .appendField(
            `(operando de: ${commandDefinition.shellCommand})`,
            BlockIDs.FIELDS.PARENT_INDICATOR,
        )
        .appendField(`${operandDefinition.label}:`)
        .appendField(field, BlockIDs.FIELDS.VALUE);

    block.setPreviousStatement(
        true,
        BlockIDs.commandOperandStatementType(commandDefinition),
    );
    block.setNextStatement(
        true,
        BlockIDs.commandOperandStatementType(commandDefinition),
    );
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
