import "blockly/blocks";
import "blockly/msg/pt";
import { setupWorkspace } from "@/core/blockly/workspace/workspaceCreator";
import {
    getCurrentLevelId,
    setupLevelSelector,
} from "./features/session/levelLoader";
import { setupScriptHotReloader } from "./features/execution/scriptHotReloader";
import { runScript } from "./features/execution/scriptRunner";
import * as Blockly from "blockly";
import * as Logger from "./features/ui/systemLogger";
import * as PersistenceManager from "./features/session/persistenceManager";
import { setupHeaderBehavior } from "./features/ui/headerController";
import { getDefinitions } from "./features/session/dataManager";
import { LogLevel } from "@/types/logger";
import { MAIN_WORKSPACE_ID } from "./features/constants/constants";

function queryRequired<T extends HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (!element) throw new Error(`Elemento ausente no HTML: ${id}`);
    return element as T;
}

const pageElements = {
    blocklyArea: queryRequired<HTMLDivElement>("blockly-area"),
    codeOutput: queryRequired<HTMLPreElement>("code-output"),
    cliOutput: queryRequired<HTMLPreElement>("cli-output"),
    runBtn: queryRequired<HTMLButtonElement>("run-btn"),
    clearBtn: queryRequired<HTMLButtonElement>("clear-btn"),
    headerRoot: queryRequired<HTMLElement>("app-header"),
    headerToggleBtn: queryRequired<HTMLButtonElement>("header-toggle-btn"),
    levelSelect: queryRequired<HTMLSelectElement>("level-select"),
    levelSummaryText: queryRequired<HTMLElement>("level-summary-text"),
    levelFullDetails: queryRequired<HTMLElement>("level-full-details"),
    levelDescription: queryRequired<HTMLDivElement>("level-full-details"),
    validationModal: queryRequired<HTMLDialogElement>("validation-modal"),
    validationErrorList: queryRequired<HTMLUListElement>(
        "validation-error-list",
    ),
    closeModalBtn: queryRequired<HTMLButtonElement>("close-modal-btn"),
    systemLogContainer: queryRequired<HTMLDivElement>("system-log-container"),
    btnSaveScript: queryRequired<HTMLButtonElement>("btn-save-script"),
    btnLoadScript: queryRequired<HTMLButtonElement>("btn-load-script"),
    btnLoadDefs: queryRequired<HTMLButtonElement>("btn-load-defs"),
    btnLoadGame: queryRequired<HTMLButtonElement>("btn-load-game"),
    btnResetDefs: queryRequired<HTMLButtonElement>("btn-reset-defs"),
};

async function start(): Promise<void> {
    const definitions = await getDefinitions();
    const workspace = await setupWorkspace(
        pageElements.blocklyArea,
        definitions,
        Logger.log,
        MAIN_WORKSPACE_ID,
    );
    Logger.initSystemLogger(pageElements.systemLogContainer, workspace);

    if (workspace == null) {
        Logger.log(
            "Não foi possível criar o workspace! Aplicação abortada.",
            LogLevel.ERROR,
        );
        return;
    }

    setupHeaderBehavior(pageElements.headerRoot, pageElements.headerToggleBtn);

    await setupLevelSelector(
        pageElements.levelSelect,
        pageElements.levelSummaryText,
        pageElements.levelFullDetails,
    );

    setupScriptHotReloader(workspace, pageElements.codeOutput);
    registerButtonListeners(workspace);
}

function registerButtonListeners(workspace: Blockly.WorkspaceSvg) {
    pageElements.runBtn.addEventListener("click", async () => {
        runScript(workspace, pageElements, getCurrentLevelId());
    });

    pageElements.clearBtn.addEventListener("click", () => {
        pageElements.cliOutput.textContent = "$";
    });

    pageElements.btnSaveScript.addEventListener("click", () => {
        PersistenceManager.downloadScript(workspace);
    });

    pageElements.btnLoadScript.addEventListener("click", () => {
        PersistenceManager.uploadScript(workspace);
    });

    pageElements.btnLoadDefs.addEventListener("click", () => {
        if (
            confirm(
                "Carregar novas definições limpará o workspace atual. Continuar?",
            )
        ) {
            PersistenceManager.uploadDefinitions(workspace);
        }
    });

    pageElements.btnResetDefs.addEventListener("click", () => {
        if (
            confirm(
                "ATENÇÃO: Isso apagará suas definições e níveis personalizados e voltará ao padrão do servidor. Continuar?",
            )
        ) {
            PersistenceManager.resetToFactorySettings(workspace, async () => {
                await setupLevelSelector(
                    pageElements.levelSelect,
                    pageElements.levelSummaryText,
                    pageElements.levelFullDetails,
                );
                pageElements.levelSelect.selectedIndex = 0;
                pageElements.levelSelect.dispatchEvent(new Event("change"));
            });
        }
    });

    pageElements.btnLoadGame.addEventListener("click", () => {
        PersistenceManager.uploadGameData(workspace, () => {
            setupLevelSelector(
                pageElements.levelSelect,
                pageElements.levelSummaryText,
                pageElements.levelFullDetails,
            );
        });
    });
}

start();
