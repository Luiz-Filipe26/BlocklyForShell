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
        },
    };
}

function appendOptionInputs(
    commandDefinition: CLI.CLICommand,
    block: Blockly.Block,
): void {
    const dropdown = buildOptionDropdown(commandDefinition);

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

    const stmtType = BlockIDs.commandOptionStatementType(commandDefinition);

    block.setPreviousStatement(true, stmtType);
    block.setNextStatement(true, stmtType);

    block.setColour(commandDefinition.optionColor || commandDefinition.color);
}

function buildOptionDropdown(
    commandDefinition: CLI.CLICommand,
): Blockly.FieldDropdown {
    const dropdownPairs = commandDefinition.options.map((option) => {
        const longFlag = option.longFlag ? ` | ${option.longFlag}` : "";
        const summary = option.description.split(".")[0];
        const label = `${option.flag}${longFlag} (${summary})`;
        return [label, option.flag] as [string, string];
    });

    const descriptionByFlag = new Map(
        commandDefinition.options.map((opt) => [opt.flag, opt.description]),
    );

    const updateTooltip = function(
        this: Blockly.FieldDropdown,
        newValue: string,
    ) {
        this.getSourceBlock()?.setTooltip(
            descriptionByFlag.get(newValue) || "",
        );
        return newValue;
    };

    return new Blockly.FieldDropdown(dropdownPairs, updateTooltip);
}
