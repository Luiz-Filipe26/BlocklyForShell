import * as Blockly from "blockly";
import * as CLI from "../types/cli";
import { setError, clearError } from "./validationManager";
import { getBlockSemanticData } from "../serialization/metadataManager";
import { VALIDATION_ERRORS } from "../constants/validationErrors";

/**
 * Analisa a sequência de tokens dos operandos contra as regras de sintaxe.
 */
export function validateOperandSyntax(
    commandBlock: Blockly.Block,
    commandDefinition: CLI.CLICommand,
    operandBlocks: Blockly.Block[],
): void {
    clearError(commandBlock, VALIDATION_ERRORS.SYNTAX_ERROR_ID);

    const rules = commandDefinition.operandSyntaxRules;
    if (!rules || rules.length === 0) return;

    const normalizedSequence = getNormalizedSequence(
        operandBlocks,
        commandDefinition,
    );

    for (const rule of rules) {
        try {
            const regex = new RegExp(`^${rule.regexPattern}$`);
            const regexSuccess = regex.test(normalizedSequence);
            const isSyntaxGuaranteedValid = regexSuccess && !rule.errorMessage;
            if (isSyntaxGuaranteedValid) return;
            const isKnownError = regexSuccess && rule.errorMessage;
            if (isKnownError) {
                setError(
                    commandBlock,
                    VALIDATION_ERRORS.SYNTAX_ERROR_ID,
                    rule.errorMessage || "",
                );
                return;
            }
        } catch (e) {
            console.error(
                `Falha no Regex de sintaxe do comando ${commandDefinition.id}`,
            );
        }
    }

    setError(
        commandBlock,
        VALIDATION_ERRORS.SYNTAX_ERROR_ID,
        "A ordem ou combinação de blocos é inválida para este comando.",
    );
}

function getNormalizedSequence(
    operandBlocks: Blockly.Block[],
    commandDefinition: CLI.CLICommand,
): string {
    const delimiter = commandDefinition.operandIdsSequenceDelimiter || "-";

    return operandBlocks
        .map((block) => {
            const data = getBlockSemanticData(block);
            return data ? `${data.name}${delimiter}` : "";
        })
        .join("");
}
