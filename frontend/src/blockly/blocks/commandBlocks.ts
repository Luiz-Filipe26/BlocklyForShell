import * as BlockIDs from "@/blockly/constants/blockIds";
import * as Blockly from "blockly";
import { buildCommandHelpHTML } from "@/app/uiFeedback";
import { renderBlockWarnings } from "@/blockly/validation/validationWarnings";
import * as BlockUtils from "./blockUtils";
import * as CLI from "@/types/cli";
import { setBlockSemanticData } from "@/blockly/serialization/metadataManager";
import {
    unplugExclusiveOptionsFromCommand,
    unplugDuplicatesFromList,
    autoFixExcessOperands,
} from "@/blockly/validation/autofix";
import { validateCardinality } from "@/blockly/validation/cardinalityValidator";

export function createCommandBlock(commandDefinition: CLI.CLICommand): void {
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
    commandDefinition: CLI.CLICommand,
    block: Blockly.BlockSvg,
): void {
    const helpIcon = BlockUtils.createGenericHelpIcon(() =>
        buildCommandHelpHTML(commandDefinition),
    );

    block
        .appendDummyInput(BlockIDs.DUMMY_INPUTS.HEADER)
        .appendField(commandDefinition.label)
        .appendField(" ")
        .appendField(helpIcon)
        .appendField(
            BlockUtils.createCardinalityField(28),
            BlockIDs.FIELDS.CARDINALITY_ICON,
        );
}

function appendCommandInputs(
    commandDefinition: CLI.CLICommand,
    block: Blockly.BlockSvg,
): void {
    if (commandDefinition.options && commandDefinition.options.length > 0) {
        block
            .appendStatementInput(BlockIDs.INPUTS.OPTIONS)
            .setCheck(BlockIDs.commandOptionStatementType(commandDefinition))
            .appendField("Opções:");
    }

    if (commandDefinition.operands && commandDefinition.operands.length > 0) {
        block
            .appendStatementInput(BlockIDs.INPUTS.OPERANDS)
            .setCheck(BlockIDs.commandOperandStatementType(commandDefinition))
            .appendField("Operandos:");
    }

    block.setPreviousStatement(true, BlockIDs.commandStatementType());
    block.setNextStatement(true, BlockIDs.commandStatementType());
    block.setColour(commandDefinition.color);
    block.setTooltip(commandDefinition.description);
}

function setupCommandDeduplication(
    commandDefinition: CLI.CLICommand,
    block: Blockly.BlockSvg,
): void {
    BlockUtils.addLocalChangeListener(block, () => {
        const optionBlocks = BlockUtils.getBlocksList(
            block.getInputTargetBlock(BlockIDs.INPUTS.OPTIONS),
            BlockIDs.commandOptionBlockType(commandDefinition),
        );

        unplugDuplicatesFromList(optionBlocks, (child) =>
            child.getFieldValue(BlockIDs.FIELDS.FLAG),
        );
    });
}

function setupCardinalityPipeline(
    commandDefinition: CLI.CLICommand,
    block: Blockly.BlockSvg,
): void {
    BlockUtils.addLocalChangeListener(block, () => {
        validateCardinality(block, commandDefinition);
        renderBlockWarnings(block);
        BlockUtils.updateCardinalityIndicator(block);
        autoFixExcessOperands(block, commandDefinition);
    });
}

function setupExclusiveOptionsValidation(
    commandDefinition: CLI.CLICommand,
    block: Blockly.BlockSvg,
): void {
    if (
        !commandDefinition.exclusiveOptions ||
        commandDefinition.exclusiveOptions.length === 0
    )
        return;

    BlockUtils.addLocalChangeListener(block, () => {
        const optionBlocks = BlockUtils.getBlocksList(
            block.getInputTargetBlock(BlockIDs.INPUTS.OPTIONS),
            BlockIDs.commandOptionBlockType(commandDefinition),
        );

        if (commandDefinition.exclusiveOptions) {
            unplugExclusiveOptionsFromCommand(
                optionBlocks,
                commandDefinition.exclusiveOptions,
            );
        }
    });
}
