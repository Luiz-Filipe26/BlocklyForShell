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
    codeOutput: document.getElementById("code-output"),
};

let workspace;

const blocklyOptions = {
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

function start() {
    initSystemBlocks();

    for (const def of cliDefinitions.commands) {
        createBlocksFromDefinition(def);
    }

    workspace = Blockly.inject(
        pageElements.blocklyArea,
        blocklyOptions,
    );

    disableOrphanBlocks(workspace);

    const rootBlock = workspace.newBlock('script_root');
    rootBlock.initSvg();
    rootBlock.render();
    rootBlock.moveBy(50, 50);
    

    workspace.addChangeListener((event) => {
        if (event.type === Blockly.Events.UI) return;
        const ast = serializeWorkspaceToAST(workspace);
        
        if (ast) {
            pageElements.codeOutput.textContent = JSON.stringify(ast, null, 2);
        } else {
            pageElements.codeOutput.textContent = "// Monte seu script dentro do bloco 'Script Principal'";
        }
    });
}

start();