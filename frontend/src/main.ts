import * as Blockly from "blockly/core";
import "blockly/blocks";
import "blockly/msg/pt";

import { createBlocksFromDefinition } from "./blockly/blockBuilders";
import { createToolbox } from "./blockly/toolboxBuilder";
import { initSystemBlocks } from "./blockly/systemBlocks";
import { disableOrphanBlocks } from "./blockly/orphanHandler";
import { serializeWorkspaceToAST } from "./blockly/serializer";
import type { CliDefinitions } from "./types/cli";

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
};

let workspace: Blockly.WorkspaceSvg | null = null;

function getBlocklyOptions(cliDefinitions: CliDefinitions): Blockly.BlocklyOptions {
    return {
        toolbox: createToolbox(cliDefinitions),
        renderer: "zelos",
        trashcan: true,
        scrollbars: true,
        zoom: {
            controls: true,
            wheel: true,
            startScale: 0.9,
            maxScale: 3,
            minScale: 0.3,
            scaleSpeed: 1.2,
        },
        move: {
            scrollbars: true,
            drag: true,
            wheel: true,
        },
        grid: {
            spacing: 20,
            length: 3,
            colour: "#ccc",
            snap: true,
        },
    };
}

async function start(): Promise<void> {
    initSystemBlocks();

    const response = await fetch("http://localhost:7000/api/definitions");

    if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} - ${response.statusText}`);
    }

    const cliDefinitions = await response.json();

    for (const def of cliDefinitions.commands) {
        createBlocksFromDefinition(def);
    }

    workspace = Blockly.inject(pageElements.blocklyArea, getBlocklyOptions(cliDefinitions));

    if (!workspace) throw new Error("Falha ao inicializar o workspace do Blockly");

    disableOrphanBlocks(workspace);

    const rootBlock = workspace.newBlock("script_root");
    rootBlock.initSvg();
    rootBlock.render();
    rootBlock.moveBy(50, 50);

    const MIN_INTERVAL_MS = 700;
    let lastRequestTime = 0;
    let pendingTimer: number | null = null;

    async function sendAstToBackend(): Promise<void> {
        if (!workspace) return;
        const ast = serializeWorkspaceToAST(workspace);

        if (!ast) {
            pageElements.codeOutput.textContent =
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
                pageElements.codeOutput.textContent = "// Erro ao gerar script no backend";
                lastRequestTime = Date.now();
                return;
            }

            const data = await response.json();
            pageElements.codeOutput.textContent = data.script ?? "// Sem script";
        } catch (err) {
            pageElements.codeOutput.textContent = "// Falha ao conectar ao backend";
        } finally {
            lastRequestTime = Date.now();
        }
    }

    workspace!.addChangeListener((event) => {
        // ignore UI-only events (e.g. click, selected)
        if (event.isUiEvent) return;
        const now = Date.now();
        const sinceLast = now - lastRequestTime;

        if (sinceLast >= MIN_INTERVAL_MS) {
            if (pendingTimer !== null) {
                clearTimeout(pendingTimer);
                pendingTimer = null;
            }
            void sendAstToBackend();
            return;
        }

        if (pendingTimer === null) {
            const wait = MIN_INTERVAL_MS - sinceLast;
            pendingTimer = window.setTimeout(() => {
                pendingTimer = null;
                void sendAstToBackend();
            }, wait);
        }
    });
}

start();
