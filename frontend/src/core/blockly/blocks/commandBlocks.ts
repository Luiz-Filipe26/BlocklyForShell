import * as BlockIDs from "../constants/blockIds";
import * as Blockly from "blockly";
import { buildCommandHelpHTML } from "../ui/helpBalloon";
import { renderBlockWarnings } from "../validation/validationWarnings";
import * as BlockComponents from "../ui/blockComponents";
import * as BlockTraversal from "../helpers/blockTraversal";
import * as CLI from "@/types/cli";
import { setBlockSemanticData } from "../serialization/metadataManager";
import {
    unplugExclusiveOptionsFromCommand,
    unplugDuplicatesFromList,
    autoFixExcessOperands,
} from "../validation/autofix";
import { validateCardinality } from "../validation/cardinalityValidator";
import { addLocalChangeListener } from "../events/blockEventListeners";

export function createCommandBlock(commandDefinition: CLI.CLICommand): void {
    Blockly.Blocks[commandDefinition.id] = {
        init: function(this: Blockly.BlockSvg) {
            setBlockSemanticData(this, {
                nodeType: "command",
                name: commandDefinition.shellCommand,
                bindings: [
                    {
                        key: "options",
                        source: "input",
                        name: BlockIDs.INPUTS.OPTIONS,
                    },
                    {
                        key: "operands",
                        source: "input",
                        name: BlockIDs.INPUTS.OPERANDS,
                    },
                ],
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
    const helpIcon = BlockComponents.createGenericHelpIcon(() =>
        buildCommandHelpHTML(commandDefinition),
    );

    block
        .appendDummyInput(BlockIDs.DUMMY_INPUTS.HEADER)
        .appendField(commandDefinition.label)
        .appendField(" ")
        .appendField(helpIcon)
        .appendField(
            BlockComponents.createCardinalityField(28),
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
    addLocalChangeListener(block, () => {
        const optionBlocks = BlockTraversal.getBlocksList(
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
    addLocalChangeListener(block, () => {
        validateCardinality(block, commandDefinition);
        renderBlockWarnings(block);
        BlockComponents.updateCardinalityIndicator(block);
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

    addLocalChangeListener(block, () => {
        const optionBlocks = BlockTraversal.getBlocksList(
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
