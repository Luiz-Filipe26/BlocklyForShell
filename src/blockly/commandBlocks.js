// blockly/commandBlocks.js
import * as Blockly from "blockly/core";
import { buildCommandHelpHTML } from "./uiFeedback.js";
import { getBlocksList, unplugDuplicatesFromList } from "./validators.js";
import { createGenericHelpIcon, createCardinalityField } from "./blockBuilders.js";
import { validateOperandCardinality } from "./operandBlocks.js";

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
    block.setOnChange(() => {
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

function setupOperandCardinalityValidation(commandDefinition, block) {
    block.setOnChange(() => {
        for (const operandDefinition of commandDefinition.operands) {
            const operandType = `${commandDefinition.name}_${operandDefinition.name}_operand`;
            validateOperandCardinality(
                block,
                operandType,
                operandDefinition.cardinality,
            );
        }
    });
}

export function createCommandBlock(commandDefinition) {
    Blockly.Blocks[commandDefinition.name] = {
        init: function() {
            appendCommandHeader(commandDefinition, this);
            appendCommandInputs(commandDefinition, this);
            setupCommandDeduplication(commandDefinition, this);
            setupOperandCardinalityValidation(commandDefinition, this);
        },
    };
}
