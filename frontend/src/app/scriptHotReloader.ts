import { serializeWorkspaceToAST } from "@/blockly/serialization/serializer";
import * as Blockly from "blockly";
import * as API from "@/types/api";
import * as Logger from "@/app/systemLogger";

const MIN_INTERVAL_MS = 700;

let lastStartTime = 0;
let pendingTimer: number | null = null;

export function setupScriptHotReloader(
    workspace: Blockly.WorkspaceSvg,
    codeOutput: HTMLPreElement,
): void {
    workspace.addChangeListener((event) => {
        if (event.isUiEvent) return;

        const now = Date.now();
        const sinceStart = now - lastStartTime;

        if (sinceStart >= MIN_INTERVAL_MS) {
            if (pendingTimer !== null) {
                clearTimeout(pendingTimer);
                pendingTimer = null;
            }
            sendAstToBackend(workspace, codeOutput);
            return;
        }

        const wait = MIN_INTERVAL_MS - sinceStart;
        if (pendingTimer !== null) clearTimeout(pendingTimer);

        pendingTimer = window.setTimeout(() => {
            pendingTimer = null;
            sendAstToBackend(workspace, codeOutput);
        }, wait);
    });
}

async function sendAstToBackend(
    workspace: Blockly.WorkspaceSvg,
    codeOutput: HTMLPreElement,
): Promise<void> {
    lastStartTime = Date.now();

    const ast = serializeWorkspaceToAST(workspace);

    if (!ast) {
        codeOutput.textContent =
            "// Monte seu script dentro do bloco 'Script Principal'";
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
            Logger.log(
                "Erro ao gerar script no backend",
                Logger.LogLevel.ERROR,
                Logger.LogMode.Console,
            );
            return;
        }

        const data: API.GeneratedScript = await response.json();
        codeOutput.textContent = data.script;
    } catch {
        codeOutput.textContent = "// Falha ao conectar ao backend";
        Logger.log(
            "Falha ao conectar no backend",
            Logger.LogLevel.ERROR,
            Logger.LogMode.Console,
        );
    }
}
