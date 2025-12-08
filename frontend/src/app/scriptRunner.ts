import * as API from "@/types/api";
import { serializeWorkspaceToAST } from "@/blockly/serialization/serializer";
import {
    BlockErrorReport,
    getWorkspaceErrors,
} from "@/blockly/validation/validationManager";
import * as Logger from "@/app/systemLogger";
import * as Blockly from "blockly";

interface RunDependencies {
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
): Promise<void> {
    const { cliOutput, codeOutput, runBtn } = deps;

    const clientErrors = getWorkspaceErrors(workspace);
    if (clientErrors.length > 0) {
        showValidationModal(clientErrors, deps, workspace);
        return;
    }

    const ast = serializeWorkspaceToAST(workspace);
    if (!ast) {
        cliOutput.textContent += "\n$ (Nenhum comando para executar)\n";
        cliOutput.scrollTop = cliOutput.scrollHeight;
        return;
    }

    const command = codeOutput.textContent ?? "";
    cliOutput.textContent += `\n$ ${command}\n`;

    runBtn.disabled = true;
    runBtn.textContent = "Executando...";
    cliOutput.scrollTop = cliOutput.scrollHeight;

    try {
        const payload: API.RunRequest = { ast, levelId: currentLevelId };
        const result = await requestExecution(payload);
        renderExecutionOutput(result, cliOutput, currentLevelId);
    } catch (error) {
        Logger.log(
            `Erro de Conexão: ${error}`,
            Logger.LogLevel.ERROR,
            Logger.LogMode.ToastAndConsole,
        );
        cliOutput.textContent += `[ERRO DE CONEXÃO]: ${error}\n`;
    } finally {
        runBtn.disabled = false;
        runBtn.textContent = "Executar";
        cliOutput.scrollTop = cliOutput.scrollHeight;
    }
}

function showValidationModal(
    errors: BlockErrorReport[],
    deps: RunDependencies,
    workspace: Blockly.WorkspaceSvg,
): void {
    const { validationModal, validationErrorList, closeModalBtn } = deps;

    validationErrorList.innerHTML = "";

    for (const item of errors) {
        const li = document.createElement("li");
        li.innerHTML = `<strong>[${item.blockName}]</strong>: ${item.messages.join(", ")}`;

        li.style.cursor = "pointer";
        li.title = "Clique para encontrar este bloco";
        li.onclick = () => {
            validationModal.close();
            Blockly.WidgetDiv.hide();
            workspace.centerOnBlock(item.blockId);
            workspace.getAllBlocks(false).forEach((block) => block.unselect());
            const block = workspace.getBlockById(item.blockId);
            block?.select();
        };

        validationErrorList.appendChild(li);
    }

    closeModalBtn.onclick = () => validationModal.close();
    validationModal.showModal();
}

async function requestExecution(
    payload: API.RunRequest,
): Promise<API.ExecutionResult> {
    const response = await fetch("http://localhost:7000/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
}

function renderExecutionOutput(
    result: API.ExecutionResult,
    cliOutput: HTMLPreElement,
    currentLevelId: string | null,
): void {
    let output = "";

    if (result.stdout) {
        const clean = cleanStdout(result.stdout);
        output += clean + (clean.endsWith("\n") ? "" : "\n");
    }

    if (result.stderr) {
        output += `[STDERR]: ${result.stderr}\n`;
    }

    cliOutput.textContent += output;

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
}

function cleanStdout(raw: string): string {
    return raw
        .split("\n")
        .filter(
            (line) =>
                !line.includes("--- INICIO DA EXECUÇÃO ---") &&
                !line.includes("--- VERIFICACAO ---"),
        )
        .join("\n");
}
