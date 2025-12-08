import * as Blockly from "blockly";
import { getErrors } from "./validationManager";

/**
 * Renderiza os erros no bloco com formatação rica e ordenação.
 */
export function renderBlockWarnings(block: Blockly.Block): void {
    const errors = getErrors(block);

    if (errors.length === 0) {
        block.setWarningText(null);
        return;
    }

    const lines: string[] = [];

    const cardSpecificOperands = errors.filter((error) =>
        error.id.startsWith("CARDINALITY_MISSING_OPERAND_"),
    );
    const cardMinOperands = errors.find(
        (error) => error.id === "CARDINALITY_MIN_OPERANDS",
    );
    const cardMinOptions = errors.find(
        (error) => error.id === "CARDINALITY_MIN_OPTIONS",
    );

    if (cardSpecificOperands.length > 0) {
        lines.push("🔴 Faltam operandos específicos:");
        cardSpecificOperands.forEach((error) => {
            const cleanMsg = error.message.replace("Falta operando: ", "");
            lines.push(`    • ${cleanMsg}`);
        });
    }

    if (cardMinOperands) lines.push(`🔴 ${cardMinOperands.message}`);

    if (cardMinOptions) lines.push(`🔴 ${cardMinOptions.message}`);

    const otherErrors = errors.filter((e) => !e.id.startsWith("CARDINALITY_"));

    if (otherErrors.length > 0) {
        if (lines.length > 0) lines.push("────────────────");

        otherErrors.forEach((err) => {
            lines.push(`⚠️ ${err.message}`);
        });
    }

    block.setWarningText(lines.join("\n"));
}
