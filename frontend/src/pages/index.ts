import "blockly/blocks";
import "blockly/msg/pt";
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
import * as ShellBlocks from "shellblocks";
import { MAIN_WORKSPACE_ID } from "./features/constants/constants";
import { getPageElements } from "./features/ui/DOMProvider";

const pageElements = getPageElements();
start();

async function start(): Promise<void> {
    const definitions = await getDefinitions();
    const workspace = await ShellBlocks.setupWorkspace(
        pageElements.blocklyArea,
        definitions,
        {
            externalLogger: Logger.log,
            workspaceId: MAIN_WORKSPACE_ID,
            shouldSetupAutosave: true,
        },
    );
    Logger.initSystemLogger(pageElements.systemLogContainer, workspace);

    if (workspace == null) {
        Logger.log(
            "Não foi possível criar o workspace! Aplicação abortada.",
            ShellBlocks.LogLevel.ERROR,
        );
        return;
    }

    setupHeaderBehavior(pageElements.appHeader, pageElements.headerToggleBtn);

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
