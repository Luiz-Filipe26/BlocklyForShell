import { serializeWorkspaceToAST } from "./serializer";
import * as Blockly from "blockly";

const MIN_INTERVAL_MS = 700;
let lastRequestTime = 0;
let pendingTimer: number | null = null;

export async function sendAstToBackend(
    workspace: Blockly.WorkspaceSvg,
    codeOutput: HTMLPreElement,
): Promise<void> {
    const ast = serializeWorkspaceToAST(workspace);

    if (!ast) {
        codeOutput.textContent =
            "// Monte seu script dentro do bloco 'Script Principal'";
        lastRequestTime = Date.now();
        return;
    }

    try {
        const response = await fetch("http://localhost:7000/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(ast),
        });

        if (!response.ok) {
            codeOutput.textContent = "// Erro ao gerar script no backend";
            return;
        }

        const data = await response.json();
        codeOutput.textContent = data.script ?? "// Sem script";
    } catch (err) {
        codeOutput.textContent = "// Falha ao conectar ao backend";
    } finally {
        lastRequestTime = Date.now();
    }
}

export function setupScriptHotReloader(
    workspace: Blockly.WorkspaceSvg,
    codeOutput: HTMLPreElement,
) {
    workspace.addChangeListener((event) => {
        if (event.isUiEvent) return;

        const sinceLast = Date.now() - lastRequestTime;

        if (sinceLast >= MIN_INTERVAL_MS) {
            if (pendingTimer !== null) {
                clearTimeout(pendingTimer);
                pendingTimer = null;
            }
            sendAstToBackend(workspace, codeOutput);
            return;
        }

        if (pendingTimer === null) {
            const wait = MIN_INTERVAL_MS - sinceLast;
            pendingTimer = window.setTimeout(() => {
                pendingTimer = null;
                sendAstToBackend(workspace, codeOutput);
            }, wait);
        }
    });
}
