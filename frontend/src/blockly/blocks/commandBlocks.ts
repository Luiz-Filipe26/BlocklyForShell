import * as Blockly from "blockly";
import { buildCommandHelpHTML } from "../../app/uiFeedback";
import { renderBlockWarnings } from "../validation/validationWarnings";
import {
    createGenericHelpIcon,
    createCardinalityField,
    addLocalChangeListener,
    updateCardinalityIndicator,
    getBlocksList,
} from "./blockUtils";
import type { CLICommand } from "../../types/cli";
import { setBlockSemanticData } from "../serialization/metadataManager";
import {
    unplugExclusiveOptionsFromCommand,
    unplugDuplicatesFromList,
    autoFixExcessOperands,
} from "../validation/autofix";
import { validateCardinality } from "../validation/cardinalityValidator";

export function createCommandBlock(commandDefinition: CLICommand): void {
    Blockly.Blocks[commandDefinition.id] = {
        init: function(this: Blockly.BlockSvg) {
            setBlockSemanticData(this, {
                nodeType: "command",
                commandName: commandDefinition.shellCommand,
            });
            appendCommandHeader(commandDefinition, this);
            appendCommandInputs(commandDefinition, this);
            setupCommandDeduplication(commandDefinition, this);
            setupExclusiveOptionsValidation(commandDefinition, this);
            setupCardinalityPipeline(commandDefinition, this);
        },
    };
}

function appendCommandHeader(
    commandDefinition: CLICommand,
    block: Blockly.BlockSvg,
): void {
    const helpIcon = createGenericHelpIcon(() =>
        buildCommandHelpHTML(commandDefinition),
    );

    block
        .appendDummyInput("HEADER")
        .appendField(commandDefinition.presentationName)
        .appendField(" ")
        .appendField(helpIcon)
        .appendField(createCardinalityField(28), "CARDINALITY_ICON");
}

function appendCommandInputs(
    commandDefinition: CLICommand,
    block: Blockly.BlockSvg,
): void {
    if (commandDefinition.options && commandDefinition.options.length > 0) {
        block
            .appendStatementInput("OPTIONS")
            .setCheck(`${commandDefinition.id}_Option`)
            .appendField("Opções:");
    }

    if (commandDefinition.operands && commandDefinition.operands.length > 0) {
        block
            .appendStatementInput("OPERANDS")
            .setCheck(`${commandDefinition.id}_Operand`)
            .appendField("Operandos:");
    }

    block.setPreviousStatement(true, "command");
    block.setNextStatement(true, "command");
    block.setColour(commandDefinition.color);
    block.setTooltip(commandDefinition.description);
}

function setupCommandDeduplication(
    commandDefinition: CLICommand,
    block: Blockly.BlockSvg,
): void {
    addLocalChangeListener(block, () => {
        const firstOptionBlock = block.getInputTargetBlock("OPTIONS");
        if (!firstOptionBlock) return;

        const optionBlocks = getBlocksList(firstOptionBlock).filter(
            (child) => child.type === `${commandDefinition.id}_option`,
        );

        unplugDuplicatesFromList(optionBlocks, (child) =>
            child.getFieldValue("FLAG"),
        );
    });
}

function setupCardinalityPipeline(
    commandDefinition: CLICommand,
    block: Blockly.BlockSvg,
): void {
    addLocalChangeListener(block, () => {
        validateCardinality(block, commandDefinition);
        renderBlockWarnings(block);
        updateCardinalityIndicator(block);
        autoFixExcessOperands(block, commandDefinition);
    });
}

function setupExclusiveOptionsValidation(
    commandDefinition: CLICommand,
    block: Blockly.BlockSvg,
): void {
    if (
        !commandDefinition.exclusiveOptions ||
        commandDefinition.exclusiveOptions.length === 0
    )
        return;

    addLocalChangeListener(block, () => {
        const firstOptionBlock = block.getInputTargetBlock("OPTIONS");
        if (!firstOptionBlock) return;

        const optionBlocks = getBlocksList(firstOptionBlock).filter(
            (child) => child.type === `${commandDefinition.id}_option`,
        );

        if (commandDefinition.exclusiveOptions) {
            unplugExclusiveOptionsFromCommand(
                optionBlocks,
                commandDefinition.exclusiveOptions,
            );
        }
    });
}
