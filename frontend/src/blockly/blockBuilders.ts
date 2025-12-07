import * as Blockly from "blockly";
import { showHelpBalloon } from "./uiFeedback";
import { createCommandBlock } from "./commandBlocks";
import { createOptionBlock } from "./optionBlocks";
import { createOperandBlocks } from "./operandBlocks";
import type { CLICommand } from "../types/cli";
import { getErrors } from "./validationManager";
import { log, LogLevel, LogMode } from "./systemLogger";

interface LocalChangeHandler {
    (block: Blockly.Block): void;
}

const blockHandlersMap = new WeakMap<Blockly.Block, LocalChangeHandler[]>();

interface LocalChangeHandler {
    (block: Blockly.Block): void;
}

export function addLocalChangeListener(
    block: Blockly.Block,
    listenerFunction: LocalChangeHandler,
): void {
    let handlers = blockHandlersMap.get(block);

    if (!handlers) {
        handlers = [];
        blockHandlersMap.set(block, handlers);

        block.setOnChange(() => {
            const currentHandlers = blockHandlersMap.get(block);
            if (currentHandlers) {
                for (const handler of currentHandlers) {
                    try {
                        handler(block);
                    } catch (error) {
                        log(
                            `Erro em change-handler: ${error}`,
                            LogLevel.ERROR,
                            LogMode.Console,
                        );
                    }
                }
            }
        });
    }

    handlers.push(listenerFunction);
}

export function removeLocalChangeListener(
    block: Blockly.Block,
    listenerFunction: LocalChangeHandler,
): void {
    const handlers = blockHandlersMap.get(block);
    if (!handlers) return;
    const newHandlers = handlers.filter(
        (handler) => handler !== listenerFunction,
    );
    blockHandlersMap.set(block, newHandlers);
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
export function createCardinalityField(size: number = 28): Blockly.FieldImage {
    return new Blockly.FieldImage(CARD_ICON_EMPTY, size, size, "cardinality");
}

/**
 * Atualiza ícone de alerta de problemas.
 */
export function updateCardinalityIndicator(commandBlock: Blockly.Block): void {
    const field = commandBlock.getField("CARDINALITY_ICON");
    if (!(field instanceof Blockly.FieldImage)) return;

    const errors = getErrors(commandBlock);
    const hasCardinalityProblems = errors.some((error) =>
        error.id.startsWith("CARDINALITY_"),
    );

    field.setValue(hasCardinalityProblems ? CARD_ICON_ALERT : CARD_ICON_EMPTY);
}

/* ===========================
   HELP ICON
   =========================== */

export function createGenericHelpIcon(
    getHelpTextFn: () => string,
    size: number = 30,
    altText: string = "?",
): Blockly.FieldImage {
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
    block: Blockly.Block,
    commandDefinition: CLICommand,
    textWhenOutside: string,
): void {
    addLocalChangeListener(block, () => {
        const indicatorField = block.getField("PARENT_INDICATOR");
        if (!indicatorField) return;

        const insideRoot =
            block.getSurroundParent()?.type === commandDefinition.id;
        indicatorField.setValue(insideRoot ? "" : textWhenOutside);
    });
}

export function createBlocksFromDefinition(
    commandDefinition: CLICommand,
): void {
    createCommandBlock(commandDefinition);
    createOptionBlock(commandDefinition);
    createOperandBlocks(commandDefinition);
}
