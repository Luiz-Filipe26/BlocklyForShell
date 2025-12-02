import * as Blockly from "blockly/core";
import "blockly/blocks";
import "blockly/msg/pt";

import { createBlocksFromDefinition } from "./blockly/blockBuilders";
import { createToolbox } from "./blockly/toolboxBuilder";
import { initSystemBlocks } from "./blockly/systemBlocks";
import { disableOrphanBlocks } from "./blockly/orphanHandler";
import { serializeWorkspaceToAST } from "./blockly/serializer";
import type { CliDefinitions } from "./types/cli";
import type { ExecutionResult, Level, RunRequest } from "./types/api";

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
};

let workspace: Blockly.WorkspaceSvg | null = null;
let currentLevelId: string | null = null;

function getBlocklyOptions(
    cliDefinitions: CliDefinitions,
): Blockly.BlocklyOptions {
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

async function loadLevels() {
    try {
        const response = await fetch("http://localhost:7000/api/levels");
        if (!response.ok) throw new Error("Falha ao buscar níveis");

        const levels: Level[] = await response.json();

        pageElements.levelSelect.innerHTML = "";

        const sandboxOption = document.createElement("option");
        sandboxOption.value = ""; // Valor vazio indica Sandbox
        sandboxOption.text = "🛠️ Modo Livre (Sandbox)";
        pageElements.levelSelect.appendChild(sandboxOption);

        levels.forEach((level) => {
            const option = document.createElement("option");
            option.value = level.id;
            option.text = `Level ${level.id}: ${level.title}`;
            option.dataset.description = level.description;
            pageElements.levelSelect.appendChild(option);
        });

        pageElements.levelSelect.addEventListener("change", () => {
            currentLevelId = pageElements.levelSelect.value || null;

            if (currentLevelId) {
                const selectedOption =
                    pageElements.levelSelect.selectedOptions[0];
                pageElements.levelDescription.textContent =
                    selectedOption.dataset.description || "";
            } else {
                pageElements.levelDescription.textContent =
                    "Ambiente livre. Crie scripts à vontade sem objetivos específicos. O sistema será resetado a cada execução.";
            }
        });

        pageElements.levelSelect.dispatchEvent(new Event("change"));
    } catch (error) {
        console.error("Erro ao carregar níveis:", error);
        pageElements.levelSelect.innerHTML =
            "<option>Erro ao carregar níveis</option>";
        pageElements.levelDescription.textContent =
            "Não foi possível conectar ao servidor para buscar os níveis.";
    }
}

async function start(): Promise<void> {
    initSystemBlocks();

    try {
        const response = await fetch("http://localhost:7000/api/definitions");
        if (!response.ok)
            throw new Error(`Erro na API Definitions: ${response.status}`);

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
    } catch (error) {
        alert(
            "Falha crítica ao iniciar a aplicação. Verifique se o Backend está rodando.",
        );
        console.error(error);
        return;
    }

    await loadLevels();

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
                body: JSON.stringify(ast), // Envia apenas a AST
            });

            if (!response.ok) {
                pageElements.codeOutput.textContent =
                    "// Erro ao gerar script no backend";
                return;
            }

            const data = await response.json();
            pageElements.codeOutput.textContent =
                data.script ?? "// Sem script";
        } catch (err) {
            pageElements.codeOutput.textContent =
                "// Falha ao conectar ao backend";
        } finally {
            lastRequestTime = Date.now();
        }
    }

    workspace.addChangeListener((event) => {
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

    pageElements.runBtn.addEventListener("click", async () => {
        if (!workspace) return;

        const ast = serializeWorkspaceToAST(workspace);
        if (!ast) {
            pageElements.cliOutput.textContent +=
                "\n$ (Nenhum comando para executar)\n";
            return;
        }

        const currentScript = pageElements.codeOutput.textContent || "";
        pageElements.cliOutput.textContent += `\n$ ${currentScript}\n`;

        pageElements.runBtn.disabled = true;
        pageElements.runBtn.textContent = "Executando...";

        pageElements.cliOutput.scrollTop = pageElements.cliOutput.scrollHeight;

        try {
            const payload: RunRequest = {
                ast: ast,
                levelId: currentLevelId,
            };

            const response = await fetch("http://localhost:7000/api/run", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const result: ExecutionResult = await response.json();

            let outputText = "";
            if (result.stdout) {
                outputText += result.stdout;
                if (!outputText.endsWith("\n") && outputText.length > 0)
                    outputText += "\n";
            }

            if (result.stderr) {
                outputText += `[STDERR]: ${result.stderr}\n`;
            }

            pageElements.cliOutput.textContent += outputText;

            if (currentLevelId) {
                if (result.exitCode === 0) {
                    pageElements.cliOutput.textContent +=
                        "✨ SUCESSO! Objetivo do nível concluído. ✨\n";
                } else {
                    pageElements.cliOutput.textContent += `⚠️ O objetivo não foi atingido (exit code: ${result.exitCode}). Tente novamente.\n`;
                }
            } else if (result.exitCode !== 0) {
                pageElements.cliOutput.textContent += `(Processo finalizou com erro: ${result.exitCode})\n`;
            }
        } catch (error) {
            console.error(error);
            pageElements.cliOutput.textContent += `[ERRO DE CONEXÃO]: ${error}\n`;
        } finally {
            pageElements.runBtn.disabled = false;
            pageElements.runBtn.textContent = "Executar";
            pageElements.cliOutput.scrollTop =
                pageElements.cliOutput.scrollHeight;
        }
    });

    pageElements.clearBtn.addEventListener("click", () => {
        pageElements.cliOutput.textContent = "$";
    });
}

start();
