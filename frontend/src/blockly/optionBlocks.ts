import * as Blockly from "blockly/core";
import { createGenericHelpIcon, setupParentIndicator } from "./blockBuilders";
import type { CLICommand } from "../types/cli";
import { setBlockSemanticData } from "./metadataManager.ts";

function buildOptionDropdown(
    commandDefinition: CLICommand,
): Blockly.FieldDropdown {
    const dropdownPairs: Array<[string, string]> = commandDefinition.options.map(
        (optionDefinition) => {
            const longFlagSuffix = optionDefinition.longFlag
                ? ` | ${optionDefinition.longFlag}`
                : "";
            const summary = optionDefinition.description.split(".")[0];

            return [
                `${optionDefinition.flag}${longFlagSuffix} (${summary})`,
                optionDefinition.flag,
            ];
        },
    );

    const descriptionByFlag = new Map(
        commandDefinition.options.map((optionDefinition) => [
            optionDefinition.flag,
            optionDefinition.description,
        ]),
    );

    return new Blockly.FieldDropdown(
        dropdownPairs,
        function (this: Blockly.FieldDropdown, newValue: string): string {
            const sourceBlock = this.sourceBlock_;
            if (sourceBlock) {
                const text = descriptionByFlag.get(newValue);
                sourceBlock.setTooltip(text || "");
            }
            return newValue;
        },
    );
}

function appendOptionInputs(
    commandDefinition: CLICommand,
    block: Blockly.Block,
): void {
    const dropdown = buildOptionDropdown(commandDefinition);

    const helpIcon = createGenericHelpIcon(() => {
        const flag = block.getFieldValue("FLAG");
        const optionDefinition = commandDefinition.options.find(
            (opt) => opt.flag === flag,
        );
        return optionDefinition ? optionDefinition.description : "";
    });

    block
        .appendDummyInput("MAIN_INPUT")
        .appendField(
            `(opção de: ${commandDefinition.command})`,
            "PARENT_INDICATOR",
        )
        .appendField(" ")
        .appendField(dropdown, "FLAG")
        .appendField(helpIcon);

    block.setPreviousStatement(true, `${commandDefinition.name}_Option`);
    block.setNextStatement(true, `${commandDefinition.name}_Option`);
    block.setColour(commandDefinition.option_color || commandDefinition.color);
}

export function createOptionBlock(commandDefinition: CLICommand): void {
    if (!commandDefinition.options || commandDefinition.options.length === 0) {
        return;
    }

    const type = `${commandDefinition.name}_option`;

    Blockly.Blocks[type] = {
        init: function (this: Blockly.Block) {
            setBlockSemanticData(this, {
                nodeType: "option",
                relatedCommand: commandDefinition.command,
            });
            appendOptionInputs(commandDefinition, this);
            setupParentIndicator(
                this,
                commandDefinition,
                `(opção de: ${commandDefinition.command})`,
            );
        },
    };
}
