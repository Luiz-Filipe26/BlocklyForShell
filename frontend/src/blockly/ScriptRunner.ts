import { ExecutionResult, RunRequest } from "../types/api";
import { serializeWorkspaceToAST } from "./serializer";
import * as Blockly from "blockly/core";

export async function runScript(
    workspace: Blockly.WorkspaceSvg,
    cliOutput: HTMLPreElement,
    codeOutput: HTMLPreElement,
    runBtn: HTMLButtonElement,
    currentLevelId: string | null,
) {
    const ast = serializeWorkspaceToAST(workspace);
    if (!ast) {
        cliOutput.textContent += "\n$ (Nenhum comando para executar)\n";
        return;
    }

    const commandToEcho = codeOutput.textContent || "";

    cliOutput.textContent += `\n$ ${commandToEcho}\n`;

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
            const cleanStdout = result.stdout
                .split("\n")
                .filter(
                    (line) =>
                        !line.includes("--- INICIO DA EXECUÇÃO ---") &&
                        !line.includes("--- VERIFICACAO ---"),
                )
                .join("\n");

            outputText += cleanStdout;

            if (!outputText.endsWith("\n") && outputText.length > 0) {
                outputText += "\n";
            }
        }

        if (result.stderr) {
            outputText += `[STDERR]: ${result.stderr}\n`;
        }

        cliOutput.textContent += outputText;

        if (!currentLevelId) {
            if (result.exitCode !== 0) {
                cliOutput.textContent += `(Processo finalizou com erro: ${result.exitCode})\n`;
            }
            return;
        }

        if (result.exitCode === 0) {
            cliOutput.textContent +=
                "✨ SUCESSO! Objetivo do nível concluído. ✨\n";
        } else {
            cliOutput.textContent +=
                "⚠️ O objetivo não foi atingido. Verifique a mensagem acima e tente novamente.\n";
        }
    } catch (error) {
        console.error(error);
        cliOutput.textContent += `[ERRO DE CONEXÃO]: ${error}\n`;
    } finally {
        runBtn.disabled = false;
        runBtn.textContent = "Executar";
        cliOutput.scrollTop = cliOutput.scrollHeight;
    }
}
