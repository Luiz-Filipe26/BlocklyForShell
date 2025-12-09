import * as Blockly from "blockly";
import * as Logger from "@/app/systemLogger";
import * as CLI from "@/types/cli";
import * as API from "@/types/api";
import * as DataManager from "@/app/dataManager";
import { refreshWorkspaceDefinitions } from "@/blockly/workspace/workspaceCreator";

/**
 * Baixa o workspace atual como arquivo JSON.
 */
export function downloadScript(workspace: Blockly.WorkspaceSvg): void {
    try {
        const state = Blockly.serialization.workspaces.save(workspace);
        const json = JSON.stringify(state, null, 2);

        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `script_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        Logger.log(
            "Script baixado com sucesso.",
            Logger.LogLevel.INFO,
            Logger.LogMode.Toast,
        );
    } catch (error) {
        Logger.log(`Erro ao salvar script: ${error}`, Logger.LogLevel.ERROR);
    }
}

/**
 * Carrega script do usuário no workspace.
 */
export function uploadScript(workspace: Blockly.WorkspaceSvg): void {
    triggerFileUpload((jsonContent) => {
        try {
            const state = JSON.parse(jsonContent);

            Blockly.Events.disable();
            workspace.clear();
            Blockly.serialization.workspaces.load(state, workspace);
            Blockly.Events.enable();

            Logger.log(
                "Script carregado com sucesso!",
                Logger.LogLevel.INFO,
                Logger.LogMode.Toast,
            );
        } catch (error) {
            Logger.log(
                "Arquivo de script inválido.",
                Logger.LogLevel.ERROR,
                Logger.LogMode.ToastAndConsole,
            );
        }
    });
}

/**
 * Carrega definições (CLI) e atualiza o ambiente.
 */
export function uploadDefinitions(workspace: Blockly.WorkspaceSvg): void {
    triggerFileUpload((jsonContent) => {
        try {
            const definitions: CLI.CliDefinitions = JSON.parse(jsonContent);

            if (!definitions.commands || !Array.isArray(definitions.commands)) {
                throw new Error("JSON inválido: falta array de 'commands'.");
            }

            DataManager.saveCustomDefinitions(definitions);
            refreshWorkspaceDefinitions(workspace, definitions);

            Logger.log(
                "Definições atualizadas com sucesso!",
                Logger.LogLevel.INFO,
                Logger.LogMode.ToastAndConsole,
            );
        } catch (error) {
            Logger.log(
                `Erro ao carregar definições: ${error}`,
                Logger.LogLevel.ERROR,
                Logger.LogMode.ToastAndConsole,
            );
        }
    });
}

/**
 * Reseta para padrão de fábrica.
 */
export async function resetToFactorySettings(
    workspace: Blockly.WorkspaceSvg,
    onLevelsReset: () => Promise<void>,
): Promise<void> {
    try {
        Logger.log("Iniciando reset de fábrica...", Logger.LogLevel.INFO);

        const defaultDefs = await DataManager.resetDefinitions();
        if (defaultDefs) {
            refreshWorkspaceDefinitions(workspace, defaultDefs);
        } else {
            throw new Error("Falha ao baixar definições padrão.");
        }

        await DataManager.resetGameData();
        await onLevelsReset();

        Logger.log(
            "Ambiente completo restaurado para padrões de fábrica.",
            Logger.LogLevel.INFO,
            Logger.LogMode.Toast,
        );
    } catch (error) {
        Logger.log(
            `Erro ao resetar fábrica: ${error}`,
            Logger.LogLevel.ERROR,
            Logger.LogMode.ToastAndConsole,
        );
    }
}

/**
 * Carrega níveis (Game Data) e atualiza UI.
 */
export function uploadGameData(onSuccess: (data: API.GameData) => void): void {
    triggerFileUpload((jsonContent) => {
        try {
            const gameData: API.GameData = JSON.parse(jsonContent);

            if (!gameData.levels || !Array.isArray(gameData.levels)) {
                throw new Error("JSON inválido: falta array de 'levels'.");
            }

            DataManager.saveCustomGameData(gameData);
            onSuccess(gameData);

            Logger.log(
                "Níveis atualizados manualmente.",
                Logger.LogLevel.INFO,
                Logger.LogMode.Toast,
            );
        } catch (error) {
            Logger.log(
                `Erro ao carregar níveis: ${error}`,
                Logger.LogLevel.ERROR,
                Logger.LogMode.ToastAndConsole,
            );
        }
    });
}

function triggerFileUpload(onFileRead: (content: string) => void): void {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result;
            if (typeof content === "string") onFileRead(content);
        };
        reader.readAsText(file);
    };

    input.click();
}
