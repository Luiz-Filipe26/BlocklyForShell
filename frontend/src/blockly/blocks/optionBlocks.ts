import * as Blockly from "blockly";
import * as BlockIDs from "@/blockly/constants/blockIds";
import { createGenericHelpIcon, setupParentIndicator } from "./blockUtils";
import * as CLI from "@/types/cli";
import { setBlockSemanticData } from "@/blockly/serialization/metadataManager";

export function createOptionBlock(commandDefinition: CLI.CLICommand): void {
    if (!commandDefinition.options || commandDefinition.options.length === 0) {
        return;
    }

    Blockly.Blocks[BlockIDs.commandOptionBlockType(commandDefinition)] = {
        init: function(this: Blockly.Block) {
            setBlockSemanticData(this, {
                nodeType: "option",
                relatedCommand: commandDefinition.shellCommand,
            });

            appendOptionInputs(commandDefinition, this);

            setupParentIndicator(
                this,
                commandDefinition,
                `(opção de: ${commandDefinition.shellCommand})`,
            );

            const flagField = this.getField(BlockIDs.FIELDS.FLAG);
            if (!flagField) return;
            const currentFlag = flagField.getValue();
            updateOptionBlockShape(this, currentFlag, commandDefinition);
        },
    };
}

/**
 * Adiciona ou remove o input de argumento dinamicamente baseado na flag selecionada.
 */
function updateOptionBlockShape(
    block: Blockly.Block,
    selectedFlag: string,
    commandDefinition: CLI.CLICommand,
) {
    const optionDefinition = commandDefinition.options.find(
        (option) => option.flag === selectedFlag,
    );

    const inputExists = block.getInput(BlockIDs.INPUTS.OPTION_ARG_INPUT);
    if (!optionDefinition || !optionDefinition.argument) {
        if (inputExists) block.removeInput(BlockIDs.INPUTS.OPTION_ARG_INPUT);
        return;
    }

    if (inputExists) block.removeInput(BlockIDs.INPUTS.OPTION_ARG_INPUT);
    const input = block.appendDummyInput(BlockIDs.INPUTS.OPTION_ARG_INPUT);
    input.appendField(optionDefinition.argument.label + ":");
    const argField = new Blockly.FieldTextInput(
        optionDefinition.argument.defaultValue || "",
    );

    input.appendField(argField, BlockIDs.FIELDS.OPTION_ARG_VALUE);
}

function appendOptionInputs(
    commandDefinition: CLI.CLICommand,
    block: Blockly.Block,
): void {
    const dropdown = buildOptionDropdown(commandDefinition, block);

    const helpIcon = createGenericHelpIcon(() => {
        const flag = block.getFieldValue(BlockIDs.FIELDS.FLAG);
        const optionDefinition = commandDefinition.options.find(
            (opt) => opt.flag === flag,
        );
        return optionDefinition ? optionDefinition.description : "";
    });

    block
        .appendDummyInput(BlockIDs.FIELDS.MAIN_INPUT)
        .appendField(
            `(opção de: ${commandDefinition.shellCommand})`,
            BlockIDs.FIELDS.PARENT_INDICATOR,
        )
        .appendField(" ")
        .appendField(dropdown, BlockIDs.FIELDS.FLAG)
        .appendField(helpIcon);

    block.setPreviousStatement(
        true,
        BlockIDs.commandOptionStatementType(commandDefinition),
    );
    block.setNextStatement(
        true,
        BlockIDs.commandOptionStatementType(commandDefinition),
    );

    block.setColour(commandDefinition.optionColor || commandDefinition.color);
}

function buildOptionDropdown(
    commandDefinition: CLI.CLICommand,
    block: Blockly.Block,
): Blockly.FieldDropdown {
    const dropdownPairs = commandDefinition.options.map((option) => {
        const longFlag = option.longFlag ? ` | ${option.longFlag}` : "";
        const summary = option.description.split(".")[0].substring(0, 30);
        const argIndicator = option.argument ? " [...]" : "";
        const label = `${option.flag}${longFlag} (${summary})${argIndicator}`;
        return [label, option.flag] as [string, string];
    });

    const descriptionByFlag = new Map(
        commandDefinition.options.map((option) => [
            option.flag,
            option.description,
        ]),
    );

    const validator = function(this: Blockly.FieldDropdown, newValue: string) {
        this.getSourceBlock()?.setTooltip(
            descriptionByFlag.get(newValue) || "",
        );
        if (!block.isInFlyout)
            updateOptionBlockShape(block, newValue, commandDefinition);

        return newValue;
    };

    return new Blockly.FieldDropdown(dropdownPairs, validator);
}
