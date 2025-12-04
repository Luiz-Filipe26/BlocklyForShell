import { ExecutionResult, RunRequest } from "../types/api";
import { serializeWorkspaceToAST } from "./serializer";
import * as Blockly from "blockly/core";

export async function runScript(
    workspace: Blockly.WorkspaceSvg,
    cliOutput: HTMLPreElement,
    runBtn: HTMLButtonElement,
    currentLevelId: string | null,
) {
    const ast = serializeWorkspaceToAST(workspace);
    if (!ast) {
        cliOutput.textContent += "\n$ (Nenhum comando para executar)\n";
        return;
    }

    const currentScript = cliOutput.textContent || "";
    cliOutput.textContent += `\n$ ${currentScript}\n`;

    runBtn.disabled = true;
    runBtn.textContent = "Executando...";

    cliOutput.scrollTop = cliOutput.scrollHeight;

    try {
        const payload: RunRequest = {
            ast: ast,
            levelId: currentLevelId,
        };

        const response = await fetch("http://localhost:7000/api/run", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const result: ExecutionResult = await response.json();

        let outputText = "";
        if (result.stdout) {
            outputText += result.stdout;
            if (!outputText.endsWith("\n") && outputText.length > 0)
                outputText += "\n";
        }

        if (result.stderr) {
            outputText += `[STDERR]: ${result.stderr}\n`;
        }

        cliOutput.textContent += outputText;
        if (!currentLevelId && result.exitCode !== 0) {
            cliOutput.textContent += `(Processo finalizou com erro: ${result.exitCode})\n`;
        }

        if (!currentLevelId) return;

        if (result.exitCode !== 0) {
            cliOutput.textContent += `⚠️ O objetivo não foi atingido (exit code: ${result.exitCode}). Tente novamente.\n`;
            return;
        }

        cliOutput.textContent +=
            "✨ SUCESSO! Objetivo do nível concluído. ✨\n";
    } catch (error) {
        console.error(error);
        cliOutput.textContent += `[ERRO DE CONEXÃO]: ${error}\n`;
    } finally {
        runBtn.disabled = false;
        runBtn.textContent = "Executar";
        cliOutput.scrollTop = cliOutput.scrollHeight;
    }
}
