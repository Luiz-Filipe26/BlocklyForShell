// blockly/blockBuilders.js
import * as Blockly from "blockly/core";
import { showHelpBalloon } from "./uiFeedback.js";
import { createCommandBlock } from "./commandBlocks.js";
import { createOptionBlock } from "./optionBlocks.js";
import { createOperandBlocks } from "./operandBlocks.js";

export function addLocalChangeListener(block, listenerFunction) {
    if (!block.__localChangeHandlers) {
        block.__localChangeHandlers = [];

        block.setOnChange(() => {
            for (const handler of block.__localChangeHandlers) {
                try {
                    handler(block);
                } catch (error) {
                    console.error("Erro em change-handler:", error);
                }
            }
        });
    }

    block.__localChangeHandlers.push(listenerFunction);
}

export function removeLocalChangeListener(block, listenerFunction) {
    if (!block.__localChangeHandlers) return;

    block.__localChangeHandlers = block.__localChangeHandlers.filter(
        (handler) => handler !== listenerFunction,
    );
}

/* ===========================
   ICON / CARDINALITY HELPERS
   =========================== */

const CARD_ICON_EMPTY = "/transparent.svg";
const CARD_ICON_ALERT = "/cardinality_icon.svg";

/**
 * Cria um FieldImage pronto para ser anexado ao HEADER.
 * size: px
 */
export function createCardinalityField(size = 28) {
    return new Blockly.FieldImage(CARD_ICON_EMPTY, size, size, "cardinality");
}

/**
 * Atualiza warningText + ícone com base nos problemas detectados.
 *
 * @param {Blockly.Block} commandBlock
 * @param {{
 *   optionsSetMissing: number,
 *   operandsSetMissing: number,
 *   missingOperands: Array<{name: string, amount: number}>
 * }} problems
 */
export function updateCardinalityIndicator(commandBlock, problems) {
    const field = commandBlock.getField("CARDINALITY_ICON");
    if (!field) return;

    const {
        optionsSetMissing = 0,
        operandsSetMissing = 0,
        missingOperands = [],
    } = problems;

    const hasProblems =
        optionsSetMissing > 0 ||
        operandsSetMissing > 0 ||
        missingOperands.length > 0;

    if (!hasProblems) {
        commandBlock.setWarningText(null);
        field.setValue(CARD_ICON_EMPTY);
        return;
    }
    let msg = "";

    if (missingOperands.length > 0) {
        msg += "Faltam operandos:\n";
        for (const missing of missingOperands)
            msg += ` - ${missing.name}: precisa de ${missing.amount}\n`;
    }

    if (operandsSetMissing > 0)
        msg += `Faltam operandos obrigatórios (${operandsSetMissing} no mínimo).\n`;

    if (optionsSetMissing > 0)
        msg += `Faltam opções obrigatórias (${optionsSetMissing}).`;

    commandBlock.setWarningText(msg);
    field.setValue(CARD_ICON_ALERT);
}

/* ===========================
   HELP ICON
   =========================== */

export function createGenericHelpIcon(getHelpTextFn, size = 30, altText = "?") {
    const helpIcon = new Blockly.FieldImage(
        "/info_icon.svg",
        size,
        size,
        altText,
    );

    helpIcon.setOnClickHandler(() => {
        const helpText = getHelpTextFn();
        if (!helpText) return;

        const svgElement = helpIcon.getSvgRoot();
        if (svgElement) showHelpBalloon(helpText, svgElement);
    });

    return helpIcon;
}

/**
 * Define o comportamento do campo PARENT_INDICATOR (visível quando fora do comando).
 */
export function setupParentIndicator(
    block,
    commandDefinition,
    textWhenOutside,
) {
    addLocalChangeListener(block, () => {
        const indicatorField = block.getField("PARENT_INDICATOR");
        if (!indicatorField) return;

        const insideRoot =
            block.getSurroundParent()?.type === commandDefinition.name;
        indicatorField.setValue(insideRoot ? "" : textWhenOutside);
    });
}

export function createBlocksFromDefinition(commandDefinition) {
    createCommandBlock(commandDefinition);
    createOptionBlock(commandDefinition);
    createOperandBlocks(commandDefinition);
}
