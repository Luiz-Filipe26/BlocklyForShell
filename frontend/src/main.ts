import "blockly/blocks";
import "blockly/msg/pt";
import { setupWorkspace } from "./blockly/workspaceCreator";
import { getCurrentLevelId, setupLevelSelector } from "./blockly/levelLoader";
import { setupScriptHotReloader } from "./blockly/scriptHotReloader";
import { runScript } from "./blockly/scriptRunner";
import {
    initSystemLogger,
    log,
    LogLevel,
    LogMode,
} from "./blockly/systemLogger";

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
    levelSelect: queryRequired<HTMLSelectElement>("level-select"),
    levelDescription: queryRequired<HTMLDivElement>("level-description"),
    validationModal: queryRequired<HTMLDialogElement>("validation-modal"),
    validationErrorList: queryRequired<HTMLUListElement>(
        "validation-error-list",
    ),
    closeModalBtn: queryRequired<HTMLButtonElement>("close-modal-btn"),
    systemLogContainer: queryRequired<HTMLDivElement>("system-log-container"),
};

async function start(): Promise<void> {
    const workspace = await setupWorkspace(pageElements.blocklyArea);

    if (workspace == null) {
        log(
            "Não foi possível criar o workspace! Aplicação abortada.",
            LogLevel.ERROR,
            LogMode.Console,
        );
        return;
    }

    initSystemLogger(pageElements.systemLogContainer, workspace);

    await setupLevelSelector(
        pageElements.levelSelect,
        pageElements.levelDescription,
    );

    setupScriptHotReloader(workspace, pageElements.codeOutput);

    pageElements.runBtn.addEventListener("click", async () => {
        runScript(workspace, pageElements, getCurrentLevelId());
    });

    pageElements.clearBtn.addEventListener("click", () => {
        pageElements.cliOutput.textContent = "$";
    });
}

start();
