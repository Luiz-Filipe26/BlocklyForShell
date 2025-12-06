import "blockly/blocks";
import "blockly/msg/pt";
import { setupWorkspace } from "./blockly/WorkspaceCreator";
import { getCurrentLevelId, setupLevelSelector } from "./blockly/LevelLoader";
import { setupScriptHotReloader } from "./blockly/ScriptHotReloader";
import { runScript } from "./blockly/ScriptRunner";

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
};

async function start(): Promise<void> {
    const workspace = await setupWorkspace(pageElements.blocklyArea);

    if (workspace == null) {
        alert("Não foi possível criar o workspace!");
        return;
    }

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
