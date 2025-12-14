import * as Blockly from "blockly";
import * as CLI from "@/types/cli";
import * as ValidationErrors from "../constants/validationErrors";
import { clearError, setError } from "../validation/validationManager";

/**
 * Faz a validação de regex dos operandos
 */
export function validateOperandValue(
    text: string,
    rules: CLI.CLIValidation[],
    block: Blockly.Block,
): void {
    rules.forEach((rule, index) => {
        const ruleErrorId = ValidationErrors.operandRegexRuleError(index);
        const regex = new RegExp(rule.regex);

        if (!regex.test(text)) {
            setError(block, ruleErrorId, rule.errorMessage);
        } else {
            clearError(block, ruleErrorId);
        }
    });
}
