// blockly/commandBlocks.js
import * as Blockly from "blockly/core";
import { buildCommandHelpHTML } from "./uiFeedback.js";
import { autoFixExcessOperands, collectCardinalityProblems, getBlocksList, unplugDuplicatesFromList } from "./validators.js";
import {
    createGenericHelpIcon,
    createCardinalityField,
    addLocalChangeListener,
    updateCardinalityIndicator,
} from "./blockBuilders.js";

function appendCommandHeader(commandDefinition, block) {
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

function appendCommandInputs(commandDefinition, block) {
    block
        .appendStatementInput("OPTIONS")
        .setCheck(`${commandDefinition.name}_Option`)
        .appendField("Opções:");

    block
        .appendStatementInput("OPERANDS")
        .setCheck(`${commandDefinition.name}_Operand`)
        .appendField("Operandos:");

    block.setPreviousStatement(true, "command");
    block.setNextStatement(true, "command");
    block.setColour(commandDefinition.color);
    block.setTooltip(commandDefinition.description);
}

function setupCommandDeduplication(commandDefinition, block) {
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

function setupCardinalityPipeline(commandDefinition, block) {
    addLocalChangeListener(block, () => {
        const problems = collectCardinalityProblems(block, commandDefinition);
        updateCardinalityIndicator(block, problems);
        autoFixExcessOperands(block, commandDefinition);
    });
}

export function createCommandBlock(commandDefinition) {
    Blockly.Blocks[commandDefinition.name] = {
        init: function() {
            appendCommandHeader(commandDefinition, this);
            appendCommandInputs(commandDefinition, this);
            setupCommandDeduplication(commandDefinition, this);
            setupCardinalityPipeline(commandDefinition, this);
        },
    };
}
