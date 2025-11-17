// blockly/operandBlocks.js
import * as Blockly from "blockly/core";

import {
    validateOperandValue,
    getBlocksList,
} from "./validators.js";

import { updateCardinalityField } from "./blockBuilders.js";

import { setupParentIndicator } from "./blockBuilders.js";

/* ============================================================
   INTERNAL HELPERS
   ============================================================ */

function buildOperandField(operandDefinition, block) {
    const textField = new Blockly.FieldTextInput(
        operandDefinition.defaultValue || "",
    );

    textField.setValidator((text) =>
        validateOperandValue(text, operandDefinition.validations, block),
    );

    return textField;
}

function appendOperandInputs(commandDefinition, operandDefinition, block) {
    const field = buildOperandField(operandDefinition, block);

    block
        .appendDummyInput("MAIN_INPUT")
        .appendField(
            `(operando de: ${commandDefinition.command})`,
            "PARENT_INDICATOR",
        )
        .appendField(`${operandDefinition.name}:`)
        .appendField(field, "VALUE");

    block.setPreviousStatement(true, `${commandDefinition.name}_Operand`);
    block.setNextStatement(true, `${commandDefinition.name}_Operand`);
    block.setColour(operandDefinition.color || commandDefinition.color);
    block.setTooltip(operandDefinition.description);
}

/* ============================================================
   CARDINALITY VALIDATION
   ============================================================ */

export function validateOperandCardinality(
    commandBlock,
    operandType,
    cardinality,
) {
    const root = commandBlock.getInputTargetBlock("OPERANDS");

    const blocks = root
        ? getBlocksList(root).filter((b) => b.type === operandType)
        : [];

    const count = blocks.length;

    const min = cardinality?.min ?? 0;
    const max =
        cardinality?.max === "unlimited"
            ? Infinity
            : (cardinality?.max ?? Infinity);

    /* ------------------------------
         1. VALIDAR FALTAS
         ------------------------------ */

    const missing = Math.max(0, min - count);

    // Atualiza o campo de cardinalidade no header (cria se necessário)
    updateCardinalityField(commandBlock, missing, { size: 28 });

    if (missing > 0) {
        commandBlock.setWarningText(
            `Faltam operandos do tipo '${operandType}'. Necessário: min=${min}, atual=${count}.`,
        );
    } else {
        commandBlock.setWarningText(null);
    }

    /* ------------------------------
         2. REMOVER EXCESSO
         ------------------------------ */

    if (count > max) {
        const excess = count - max;

        for (let i = 0; i < excess; i++) {
            const blockToRemove = blocks.pop();
            if (blockToRemove) blockToRemove.unplug(true);
        }

        import("./uiFeedback.js").then(({ showToast }) => {
            showToast(
                commandBlock.workspace,
                `Operando '${operandType}' removido (excesso). Máximo permitido = ${max}.`,
            );
        });
    }
}

/* ============================================================
   BLOCK CREATION
   ============================================================ */

function createSingleOperandBlock(commandDefinition, operandDefinition) {
    const type = `${commandDefinition.name}_${operandDefinition.name}_operand`;

    Blockly.Blocks[type] = {
        init: function() {
            appendOperandInputs(commandDefinition, operandDefinition, this);

            setupParentIndicator(
                this,
                commandDefinition,
                `(operando de: ${commandDefinition.command})`,
            );
        },
    };
}

export function createOperandBlocks(commandDefinition) {
    for (const operandDef of commandDefinition.operands) {
        createSingleOperandBlock(commandDefinition, operandDef);
    }
}
