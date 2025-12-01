import * as Blockly from "blockly/core";
import { showHelpBalloon } from "./uiFeedback";
import { createCommandBlock } from "./commandBlocks";
import { createOptionBlock } from "./optionBlocks";
import { createOperandBlocks } from "./operandBlocks";
import type { CLICommand } from "../types/cli";

interface LocalChangeHandler {
  (block: Blockly.Block): void;
}

interface CardinalityProblems {
  optionsSetMissing?: number;
  operandsSetMissing?: number;
  missingOperands?: Array<{ name: string; amount: number }>;
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
            console.error("Erro em change-handler:", error);
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
  const newHandlers = handlers.filter((handler) => handler !== listenerFunction);
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
 * Atualiza warningText + ícone com base nos problemas detectados.
 */
export function updateCardinalityIndicator(
  commandBlock: Blockly.Block,
  problems: CardinalityProblems,
): void {
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
    (field as Blockly.FieldImage).setValue(CARD_ICON_EMPTY);
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
  (field as Blockly.FieldImage).setValue(CARD_ICON_ALERT);
}

/* ===========================
   HELP ICON
   =========================== */

export function createGenericHelpIcon(
  getHelpTextFn: () => string,
  size: number = 30,
  altText: string = "?",
): Blockly.FieldImage {
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
export function setupParentIndicator(
  block: Blockly.Block,
  commandDefinition: CLICommand,
  textWhenOutside: string,
): void {
  addLocalChangeListener(block, () => {
    const indicatorField = block.getField("PARENT_INDICATOR");
    if (!indicatorField) return;

    const insideRoot =
      block.getSurroundParent()?.type === commandDefinition.name;
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
