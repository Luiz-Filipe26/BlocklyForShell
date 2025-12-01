import * as Blockly from "blockly/core";
import { BlockSvg } from "blockly/core";
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
import type * as AST from "../types/ast";

function appendCommandHeader(
    commandDefinition: CLICommand,
    block: BlockSvg,
): void {
    const helpIcon = createGenericHelpIcon(
        () => buildCommandHelpHTML(commandDefinition),
        30,
        `Ajuda para ${commandDefinition.command}`,
    );

    block
        .appendDummyInput("HEADER")
        .appendField(commandDefinition.name)
        .appendField(" ")
        .appendField(helpIcon)
        .appendField(createCardinalityField(28), "CARDINALITY_ICON");
}

function appendCommandInputs(
    commandDefinition: CLICommand,
    block: BlockSvg,
): void {
    if (commandDefinition.options && commandDefinition.options.length > 0) {
        block
            .appendStatementInput("OPTIONS")
            .setCheck(`${commandDefinition.name}_Option`)
            .appendField("Opções:");
    }

    if (commandDefinition.operands && commandDefinition.operands.length > 0) {
        block
            .appendStatementInput("OPERANDS")
            .setCheck(`${commandDefinition.name}_Operand`)
            .appendField("Operandos:");
    }

    block.setPreviousStatement(true, "command");
    block.setNextStatement(true, "command");
    block.setColour(commandDefinition.color);
    block.setTooltip(commandDefinition.description);
}

function setupCommandDeduplication(
    commandDefinition: CLICommand,
    block: BlockSvg,
): void {
    addLocalChangeListener(block, () => {
        const firstOptionBlock = block.getInputTargetBlock("OPTIONS");
        if (!firstOptionBlock) return;

        const optionBlocks = getBlocksList(firstOptionBlock).filter(
            (child) => child.type === `${commandDefinition.name}_option`,
        );

        unplugDuplicatesFromList(block.workspace, optionBlocks, (child) =>
            child.getFieldValue("FLAG"),
        );
    });
}

function setupCardinalityPipeline(
    commandDefinition: CLICommand,
    block: BlockSvg,
): void {
    addLocalChangeListener(block, () => {
        const problems = collectCardinalityProblems(block, commandDefinition);
        updateCardinalityIndicator(block, problems);
        autoFixExcessOperands(block, commandDefinition);
    });
}

function setupExclusiveOptionsValidation(
    commandDefinition: CLICommand,
    block: BlockSvg,
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
            (child) => child.type === `${commandDefinition.name}_option`,
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
    Blockly.Blocks[commandDefinition.name] = {
        init: function (this: BlockSvg) {
            const block = this as BlockSvg & { semanticData: AST.BlockSemanticData };
            block.semanticData = {
                nodeType: "command",
                commandName: commandDefinition.command,
            };
            appendCommandHeader(commandDefinition, this);
            appendCommandInputs(commandDefinition, this);
            setupCommandDeduplication(commandDefinition, this);
            setupExclusiveOptionsValidation(commandDefinition, this);
            setupCardinalityPipeline(commandDefinition, this);
        },
    };
}
