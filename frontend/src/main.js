import * as Blockly from "blockly/core";
import "blockly/blocks";
import "blockly/msg/pt";

import { createBlocksFromDefinition } from "./blockly/blockBuilders.js";
import { createToolbox } from "./blockly/toolboxBuilder.js";
import { initSystemBlocks } from "./blockly/systemBlocks.js";
import { disableOrphanBlocks } from "./blockly/orphanHandler.js";
import { serializeWorkspaceToAST } from "./blockly/serializer.js";

const pageElements = {
    blocklyArea: document.getElementById("blockly-area"),
    codeOutput: document.getElementById("code-output"),
    cliOutput: document.getElementById("cli-output"),
    runBtn: document.getElementById("run-btn"),
    clearBtn: document.getElementById("clear-btn"),
};

let workspace;

function getBlocklyOptions(cliDefinitions) {
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

async function start() {
    initSystemBlocks();

    const response = await fetch("http://localhost:7000/api/definitions");

    if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} - ${response.statusText}`);
    }

    const cliDefinitions = await response.json();

    for (const def of cliDefinitions.commands) {
        createBlocksFromDefinition(def);
    }

    workspace = Blockly.inject(
        pageElements.blocklyArea,
        getBlocklyOptions(cliDefinitions),
    );

    disableOrphanBlocks(workspace);

    const rootBlock = workspace.newBlock("script_root");
    rootBlock.initSvg();
    rootBlock.render();
    rootBlock.moveBy(50, 50);

    const MIN_INTERVAL_MS = 700;
    let lastRequestTime = 0;
    let pendingTimer = null;
    let pendingScheduledAt = 0;

    /**
     * Envia a AST atual ao backend e atualiza codeOutput.
     * Serializa só no momento do envio (para ter AST fresco).
     */
    async function sendAstToBackend() {
        // recalcula AST no momento do envio
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
                pageElements.codeOutput.textContent =
                    "// Erro ao gerar script no backend";
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

    workspace.addChangeListener((event) => {
        if (event.type === Blockly.Events.UI) return;

        const now = Date.now();
        const sinceLast = now - lastRequestTime;

        // se já passou o intervalo mínimo -> reagir **agora**
        if (sinceLast >= MIN_INTERVAL_MS) {
            if (pendingTimer) {
                clearTimeout(pendingTimer);
                pendingTimer = null;
                pendingScheduledAt = 0;
            }
            void sendAstToBackend();
            return;
        }

        if (!pendingTimer) {
            const wait = MIN_INTERVAL_MS - sinceLast;
            pendingScheduledAt = now + wait;
            pendingTimer = setTimeout(() => {
                pendingTimer = null;
                pendingScheduledAt = 0;
                void sendAstToBackend();
            }, wait);
        }

        // não fazer mais nada: esperamos o send agendado executar
    });
}

start();
