import * as Blockly from "blockly";
import * as Logger from "@/app/systemLogger";

export const AUTOSAVE_STORAGE_KEY = "blockly_workspace_autosave";
const SAVE_DELAY_MS = 1000;

let saveTimeout: number | null = null;

/**
 * Carrega o estado salvo (se existir) para o workspace.
 * Retorna true se carregou algo, false se não havia nada salvo.
 */
export function loadSession(workspace: Blockly.WorkspaceSvg): boolean {
    try {
        const serializedState = localStorage.getItem(AUTOSAVE_STORAGE_KEY);
        if (!serializedState) return false;

        const jsonState = JSON.parse(serializedState);
        secureLoadSerializedWorkspace(workspace, jsonState);

        Logger.log(
            "Sessão anterior restaurada com sucesso.",
            Logger.LogLevel.INFO,
            Logger.LogMode.ToastAndConsole,
        );
        return true;
    } catch (error) {
        Logger.log(
            `Erro ao carregar sessão automática: ${error}`,
            Logger.LogLevel.ERROR,
            Logger.LogMode.Console,
        );
        localStorage.removeItem(AUTOSAVE_STORAGE_KEY);
        return false;
    }
}

function secureLoadSerializedWorkspace(
    workspace: Blockly.WorkspaceSvg,
    jsonState: { [key: string]: any },
) {
    Blockly.Events.disable();
    workspace.clear();
    Blockly.serialization.workspaces.load(jsonState, workspace);
    Blockly.Events.enable();
}

/**
 * Inicializa o listener que salva o workspace automaticamente.
 */
export function initAutoSaver(workspace: Blockly.WorkspaceSvg): void {
    workspace.addChangeListener((e) => {
        if (e.isUiEvent) return;

        if (saveTimeout) {
            clearTimeout(saveTimeout);
        }

        saveTimeout = window.setTimeout(() => {
            saveState(workspace);
            saveTimeout = null;
        }, SAVE_DELAY_MS);
    });
}

function saveState(workspace: Blockly.WorkspaceSvg): void {
    try {
        const state = Blockly.serialization.workspaces.save(workspace);
        const jsonState = JSON.stringify(state);
        localStorage.setItem(AUTOSAVE_STORAGE_KEY, jsonState);
    } catch (error) {
        console.error("Falha ao salvar workspace no localStorage", error);
    }
}

/**
 * Limpa o save automático (útil para o botão "Resetar")
 */
export function clearAutoSave(): void {
    localStorage.removeItem(AUTOSAVE_STORAGE_KEY);
}
