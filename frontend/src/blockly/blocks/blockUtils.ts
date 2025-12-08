import * as Blockly from "blockly";
import { log, LogLevel, LogMode } from "@/app/systemLogger";
import { showHelpBalloon } from "@/app/uiFeedback";
import * as CLI from "@/types/cli";
import { getErrors } from "@/blockly/validation/validationManager";

interface LocalChangeHandler {
    (block: Blockly.Block): void;
}

const CARD_ICON_EMPTY = "/transparent.svg";
const CARD_ICON_ALERT = "/cardinality_icon.svg";

const blockHandlersMap = new WeakMap<Blockly.Block, LocalChangeHandler[]>();

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

/**
 * Lista blocos em linha
 */
export function getBlocksList(
    firstBlock: Blockly.Block | null,
    filter?: string | ((block: Blockly.Block) => boolean),
): Blockly.Block[] {
    const blocks: Blockly.Block[] = [];

    for (
        let current: Blockly.Block | null = firstBlock;
        current;
        current = current.getNextBlock()
    ) {
        if (typeof filter === "string") {
            if (current.type !== filter) continue;
        } else if (typeof filter === "function") {
            if (!filter(current)) continue;
        }

        blocks.push(current);
    }

    return blocks;
}

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

export function createGenericHelpIcon(
    getHelpTextFn: () => string,
    altText: string = "?",
    size: number = 30,
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
    commandDefinition: CLI.CLICommand,
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
