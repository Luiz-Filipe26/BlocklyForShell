import * as Blockly from "blockly/core";
import "blockly/blocks";
import "blockly/msg/pt";

import cliDefinitions from "./data/cli_definitions.json";

import { createBlocksFromDefinition } from "./blockly/blockBuilders.js";
import { createToolbox } from "./blockly/toolboxBuilder.js";

const pageElements = {
    blocklyArea: document.getElementById("blockly-area"),
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
    for (const def of cliDefinitions.commands) {
        createBlocksFromDefinition(def);
    }

    workspace = Blockly.inject(
        pageElements.blocklyArea,
        blocklyOptions,
    );
}

start();
