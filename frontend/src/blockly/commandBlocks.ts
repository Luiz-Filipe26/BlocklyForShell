import * as Blockly from "blockly";
import { buildCommandHelpHTML } from "./uiFeedback";
import {
    autoFixExcessOperands,
    checkAndFixExclusiveOptions,
    collectCardinalityProblems,
    getBlocksList,
    unplugDuplicatesFromList,
} from "./validators";
import {
    createGenericHelpIcon,
    createCardinalityField,
    addLocalChangeListener,
    updateCardinalityIndicator,
} from "./blockBuilders";
import type { CLICommand } from "../types/cli";
import { setBlockSemanticData } from "./metadataManager.ts";

function appendCommandHeader(
    commandDefinition: CLICommand,
    block: Blockly.BlockSvg,
): void {
    const helpIcon = createGenericHelpIcon(
        () => buildCommandHelpHTML(commandDefinition),
        30,
        `Ajuda para ${commandDefinition.presentationName}`,
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

        unplugDuplicatesFromList(block.workspace, optionBlocks, (child) =>
            child.getFieldValue("FLAG"),
        );
    });
}

function setupCardinalityPipeline(
    commandDefinition: CLICommand,
    block: Blockly.BlockSvg,
): void {
    addLocalChangeListener(block, () => {
        const problems = collectCardinalityProblems(block, commandDefinition);
        updateCardinalityIndicator(block, problems);
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
    ) {
        return;
    }

    addLocalChangeListener(block, () => {
        const firstOptionBlock = block.getInputTargetBlock("OPTIONS");
        if (!firstOptionBlock) return;

        const optionBlocks = getBlocksList(firstOptionBlock).filter(
            (child) => child.type === `${commandDefinition.id}_option`,
        );

        if (commandDefinition.exclusiveOptions) {
            checkAndFixExclusiveOptions(
                block.workspace,
                optionBlocks,
                commandDefinition.exclusiveOptions,
            );
        }
    });
}

export function createCommandBlock(commandDefinition: CLICommand): void {
    Blockly.Blocks[commandDefinition.id] = {
        init: function (this: Blockly.BlockSvg) {
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
