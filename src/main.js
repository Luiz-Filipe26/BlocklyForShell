import * as Blockly from "blockly/core";
import "blockly/blocks";
import "blockly/msg/pt";

import cliDefinitions from "./data/cli_definitions.json";

import { createBlocksFromDefinition } from "./blockly/blockBuilders.js";
import { createToolbox } from "./blockly/toolboxBuilder.js";
import { initSystemBlocks } from "./blockly/systemBlocks.js";
import { disableOrphanBlocks } from "./blockly/orphanHandler.js";
import { serializeWorkspaceToAST } from "./blockly/serializer.js";

const pageElements = {
    blocklyArea: document.getElementById("blockly-area"),
    codeOutput: document.getElementById("code-output"), // Necessário para mostrar o JSON
};

let workspace;

function createEnhancedToolbox(definitions) {
    const generated = createToolbox(definitions);

    // Adiciona a categoria "Estrutura" no topo com o bloco script_root
    generated.contents.unshift({
        kind: "category",
        name: "Estrutura",
        colour: "#333",
        contents: [{ kind: "block", type: "script_root" }],
    });

    return generated;
}

const blocklyOptions = {
    toolbox: createEnhancedToolbox(cliDefinitions),
    renderer: "zelos",
    trashcan: true,
    scrollbars: true,
    // Importante: Limita a apenas 1 bloco raiz por workspace
    maxInstances: { script_root: 1 },
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

function start() {
    // 1. Inicializa os blocos de sistema (o container 'script_root')
    initSystemBlocks();

    // 2. Inicializa os blocos dinâmicos a partir do JSON
    for (const def of cliDefinitions.commands) {
        createBlocksFromDefinition(def);
    }

    // 3. Injeta o Blockly
    workspace = Blockly.inject(pageElements.blocklyArea, blocklyOptions);

    // 4. Ativa o sistema de desabilitar blocos soltos (órfãos)
    disableOrphanBlocks(workspace);

    // 5. Cria automaticamente o bloco raiz ao iniciar (Melhor UX)
    const rootBlock = workspace.newBlock("script_root");
    rootBlock.initSvg();
    rootBlock.render();
    rootBlock.moveBy(50, 50); // Posiciona no canto superior esquerdo

    // 6. Configura o listener para gerar a Árvore (JSON) em tempo real
    workspace.addChangeListener((event) => {
        // Ignora eventos de UI (como arrastar o workspace ou clicar) para performance
        if (event.type === Blockly.Events.UI) return;

        const ast = serializeWorkspaceToAST(workspace);

        if (ast) {
            // Exibe o JSON formatado na área de código
            pageElements.codeOutput.textContent = JSON.stringify(ast, null, 2);
        } else {
            pageElements.codeOutput.textContent =
                "// Monte seu script dentro do bloco 'Script Principal'";
        }
    });
}

start();
