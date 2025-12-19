import * as Blockly from "blockly";
import * as CLI from "../types/cli";
import { setError, clearError } from "./validationManager";
import { getBlockSemanticData } from "../serialization/metadataManager";
import * as BlockTraversal from "../helpers/blockTraversal";
import { getOperatorDefinition } from "../blocks/operatorBlocks";
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

    if (shouldRelaxOperandChecks(commandBlock)) return;

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

function shouldRelaxOperandChecks(block: Blockly.Block): boolean {
    const parent = block.getSurroundParent();
    if (!parent) return false;

    const operatorDefinition = getOperatorDefinition(parent.type);
    if (!operatorDefinition) return false;

    const slotName = BlockTraversal.getParentInputName(block);
    if (!slotName) return false;

    return (
        operatorDefinition.slotsWithImplicitData?.includes(slotName) ?? false
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
