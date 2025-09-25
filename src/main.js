import * as Blockly from 'blockly/core';
import 'blockly/blocks';
import 'blockly/msg/pt';

const pageElements = {
    blocklyArea: document.getElementById('blockly-area'),
    codeOutput: document.getElementById('code-output'),
    cliOutput: document.getElementById('cli-output'),
    runBtn: document.getElementById('run-btn'),
    clearBtn: document.getElementById('clear-btn')
};

// Objetivo: suportar os comandos
// ls, cd, mkdir, cp, mv, rm, grep, cat, ps, | , & e >


const LIGHT_BLUE = "#5b80a5";

Blockly.defineBlocksWithJsonArray([
    {
        "type": "ls",
        "message0": "ls %1",
        "args0": [{ "type": "field_input", "name": "ARGS", "text": "-l" }],
        "previousStatement": null, "nextStatement": null, "colour": LIGHT_BLUE,
        "tooltip": "Lista arquivos e diretórios."
    },
]);

const toolbox = {
    'kind': 'categoryToolbox',
    'contents': [
        {
            'kind': 'category',
            'name': 'Navegação e Arquivos',
            'colour': LIGHT_BLUE,
            'contents': [
                { 'kind': 'block', 'type': 'ls' },
            ]
        },
    ]
};

const blocklyOptions = {
    toolbox: toolbox,
    renderer: 'zelos',
    trashcan: true,
    scrollbars: true,
    sounds: true,
    zoom: {
        controls: true, wheel: true, startScale: 0.9,
        maxScale: 3, minScale: 0.3, scaleSpeed: 1.2
    },
    move: {
        scrollbars: true, drag: true, wheel: true
    },
    grid: {
        spacing: 20, length: 3, colour: '#ccc', snap: true
    }
};

const workspace = Blockly.inject(pageElements.blocklyArea, blocklyOptions);
