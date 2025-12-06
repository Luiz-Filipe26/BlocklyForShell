import { ExecutionResult, RunRequest } from "../types/api";
import { serializeWorkspaceToAST } from "./serializer";
import * as Blockly from "blockly";
import { getWorkspaceErrors } from "./validationManager";

export interface RunDependencies {
    cliOutput: HTMLPreElement;
    codeOutput: HTMLPreElement;
    runBtn: HTMLButtonElement;
    validationModal: HTMLDialogElement;
    validationErrorList: HTMLUListElement;
    closeModalBtn: HTMLButtonElement;
}

export async function runScript(
    workspace: Blockly.WorkspaceSvg,
    deps: RunDependencies,
    currentLevelId: string | null,
) {
    const { cliOutput, codeOutput, runBtn } = deps;

    const clientErrors = getWorkspaceErrors(workspace);

    if (clientErrors.length > 0) {
        showValidationModal(clientErrors, deps);
        return;
    }

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

function showValidationModal(
    errors: Array<{ blockName: string; messages: string[] }>,
    deps: RunDependencies,
) {
    const { validationModal, validationErrorList, closeModalBtn } = deps;

    validationErrorList.innerHTML = "";

    errors.forEach((item) => {
        const li = document.createElement("li");
        li.innerHTML = `<strong>[${item.blockName}]</strong>: ${item.messages.join(", ")}`;
        validationErrorList.appendChild(li);
    });

    closeModalBtn.onclick = () => validationModal.close();
    validationModal.showModal();
}
