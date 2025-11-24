import * as Blockly from "blockly/core";
import { createGenericHelpIcon, setupParentIndicator } from "./blockBuilders.js";

function buildOptionDropdown(commandDefinition) {
    const dropdownPairs = commandDefinition.options.map((optionDefinition) => {
        const longFlagSuffix = optionDefinition.longFlag ? ` | ${optionDefinition.longFlag}` : "";
        const summary = optionDefinition.description.split(".")[0];

        return [
            `${optionDefinition.flag}${longFlagSuffix} (${summary})`,
            optionDefinition.flag,
        ];
    });

    const descriptionByFlag = new Map(
        commandDefinition.options.map((optionDefinition) => [
            optionDefinition.flag,
            optionDefinition.description,
        ])
    );

    return new Blockly.FieldDropdown(dropdownPairs, function(newValue) {
        const text = descriptionByFlag.get(newValue);
        this.sourceBlock_.setTooltip(text);
        return newValue;
    });
}

function appendOptionInputs(commandDefinition, block) {
    const dropdown = buildOptionDropdown(commandDefinition);

    const helpIcon = createGenericHelpIcon(() => {
        const flag = block.getFieldValue("FLAG");
        const optionDefinition = commandDefinition.options.find(
            (opt) => opt.flag === flag
        );
        return optionDefinition ? optionDefinition.description : "";
    });

    block.appendDummyInput("MAIN_INPUT")
        .appendField(`(opção de: ${commandDefinition.command})`, "PARENT_INDICATOR")
        .appendField(" ")
        .appendField(dropdown, "FLAG")
        .appendField(helpIcon);

    block.setPreviousStatement(true, `${commandDefinition.name}_Option`);
    block.setNextStatement(true, `${commandDefinition.name}_Option`);
    block.setColour(commandDefinition.option_color || commandDefinition.color);
}

export function createOptionBlock(commandDefinition) {
    const type = `${commandDefinition.name}_option`;

    Blockly.Blocks[type] = {
        init: function() {
            this.semanticData = {
                nodeType: "option",
                relatedCommand: commandDefinition.command
            };
            appendOptionInputs(commandDefinition, this);
            setupParentIndicator(
                this,
                commandDefinition,
                `(opção de: ${commandDefinition.command})`
            );
        }
    };
}
