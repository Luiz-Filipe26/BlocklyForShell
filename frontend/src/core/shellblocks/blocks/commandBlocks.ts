import * as BlockIDs from "../constants/blockIds";
import * as Blockly from "blockly";
import { buildCommandHelpHTML } from "../ui/helpBalloon";
import { renderBlockWarnings } from "../validation/validationWarnings";
import * as BlockComponents from "../ui/blockComponents";
import * as BlockTraversal from "../helpers/blockTraversal";
import * as CLI from "../types/cli";
import { setBlockSemanticData } from "../serialization/metadataManager";
import {
    unplugExclusiveOptionsFromCommand,
    unplugDuplicatesFromList,
    autoFixExcessOperands,
} from "../validation/autofix";
import { validateCardinality } from "../validation/cardinalityValidator";
import { addLocalChangeListener } from "../events/blockEventListeners";
import { validateOperandSyntax } from "../validation/syntaxValidator";

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
            setupCommandIntegrityPipeline(commandDefinition, this);
        },
    };
}

function appendCommandHeader(
    commandDefinition: CLI.CLICommand,
    commandBlock: Blockly.BlockSvg,
): void {
    const helpIcon = BlockComponents.createGenericHelpIcon(() =>
        buildCommandHelpHTML(commandDefinition),
    );

    commandBlock
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
    commandBlock: Blockly.BlockSvg,
): void {
    if (commandDefinition.options && commandDefinition.options.length > 0) {
        commandBlock
            .appendStatementInput(BlockIDs.INPUTS.OPTIONS)
            .setCheck(BlockIDs.commandOptionStatementType(commandDefinition))
            .appendField("Opções:");
    }

    if (commandDefinition.operands && commandDefinition.operands.length > 0) {
        commandBlock
            .appendStatementInput(BlockIDs.INPUTS.OPERANDS)
            .setCheck(BlockIDs.commandOperandStatementType(commandDefinition))
            .appendField("Operandos:");
    }

    commandBlock.setPreviousStatement(true, BlockIDs.commandStatementType());
    commandBlock.setNextStatement(true, BlockIDs.commandStatementType());
    commandBlock.setColour(commandDefinition.color);
    commandBlock.setTooltip(commandDefinition.description);
}

function setupCommandIntegrityPipeline(
    commandDefinition: CLI.CLICommand,
    commandBlock: Blockly.BlockSvg,
): void {
    addLocalChangeListener(commandBlock, () => {
        let optionBlocks = BlockTraversal.getBlocksList(
            commandBlock.getInputTargetBlock(BlockIDs.INPUTS.OPTIONS),
            BlockIDs.commandOptionBlockType(commandDefinition),
        );

        let operandBlocks = BlockTraversal.getBlocksList(
            commandBlock.getInputTargetBlock(BlockIDs.INPUTS.OPERANDS),
            BlockIDs.INPUTS.OPERANDS,
        );

        unplugDuplicatesFromList(optionBlocks, (child) =>
            child.getFieldValue(BlockIDs.FIELDS.FLAG),
        );
        optionBlocks = optionBlocks.filter((b) => b.getParent() !== null);

        if (commandDefinition.exclusiveOptions) {
            unplugExclusiveOptionsFromCommand(
                optionBlocks,
                commandDefinition.exclusiveOptions,
            );
            optionBlocks = optionBlocks.filter((b) => b.getParent() !== null);
        }

        autoFixExcessOperands(operandBlocks, commandDefinition);
        operandBlocks = operandBlocks.filter((b) => b.getParent() !== null);

        validateCardinality(commandBlock, commandDefinition, {
            optionBlocks: optionBlocks,
            operandBlocks: operandBlocks,
        });

        validateOperandSyntax(commandBlock, commandDefinition, operandBlocks);

        renderBlockWarnings(commandBlock);
        BlockComponents.updateCardinalityIndicator(commandBlock);
    });
}
