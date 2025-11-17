// blockly/blockBuilders.js
import * as Blockly from "blockly/core";
import { showHelpBalloon } from "./uiFeedback.js";
import { createCommandBlock } from "./commandBlocks.js";
import { createOptionBlock } from "./optionBlocks.js";
import { createOperandBlocks } from "./operandBlocks.js";

/* ===========================
   ICON / CARDINALITY HELPERS
   =========================== */

// caminhos no public/
const CARD_ICON_SRC = "/cardinality_icon.svg";
const CARD_ICON_EMPTY = "/transparent.svg";

/**
 * Cria um FieldImage pronto para ser anexado ao HEADER.
 * size: px
 */
export function createCardinalityField(size = 28) {
    return new Blockly.FieldImage(CARD_ICON_EMPTY, size, size, "cardinality");
}

/**
 * Atualiza (ou cria) o campo CARDINALITY_ICON no HEADER do bloco.
 * - commandBlock: bloco raiz
 * - missing: número faltante (0 => esconde usando transparent.svg)
 * - options: { size, fieldName }
 */
export function updateCardinalityField(commandBlock, missing, options = {}) {
    const size = options.size ?? 28;
    const fieldName = options.fieldName ?? "CARDINALITY_ICON";
    const src = missing > 0 ? CARD_ICON_SRC : CARD_ICON_EMPTY;

    // tenta achar field
    let field = commandBlock.getField(fieldName);
    if (!field) {
        // cria se não existir (append no HEADER)
        const header = commandBlock.getInput("HEADER");
        if (!header) return;
        field = createCardinalityField(size);
        header.appendField(field, fieldName);
    }

    // atualiza fonte do FieldImage com as APIs disponíveis
    if (typeof field.setSrc === "function") {
        try { field.setSrc(src); return; } catch (e) {}
    }
    if (typeof field.setValue === "function") {
        try { field.setValue(src); return; } catch (e) {}
    }

    // fallback: recria o campo (garante atualização em todas versões)
    try {
        const header = commandBlock.getInput("HEADER");
        if (!header) return;
        try { header.removeField(fieldName); } catch (e) {}
        header.appendField(new Blockly.FieldImage(src, size, size, "cardinality"), fieldName);
    } catch (e) {
        // se falhar, silenciosamente ignora (não crítico)
    }
}

/* ===========================
   HELP ICON
   =========================== */

export function createGenericHelpIcon(getHelpTextFn, size = 30, altText = "?") {
    const helpIcon = new Blockly.FieldImage("/info_icon.svg", size, size, altText);

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
export function setupParentIndicator(block, commandDefinition, textWhenOutside) {
    block.setOnChange(() => {
        const indicatorField = block.getField("PARENT_INDICATOR");
        if (!indicatorField) return;

        const insideRoot = block.getSurroundParent()?.type === commandDefinition.name;
        indicatorField.setValue(insideRoot ? "" : textWhenOutside);
    });
}

/**
 * Registra todos os blocos referentes a um comando.
 * (mantive aqui por compatibilidade com sua organização)
 */
export function createBlocksFromDefinition(commandDefinition) {
    createCommandBlock(commandDefinition);
    createOptionBlock(commandDefinition);
    createOperandBlocks(commandDefinition);
}
