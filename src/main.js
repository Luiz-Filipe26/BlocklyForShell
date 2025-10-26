import * as Blockly from "blockly/core";
import "blockly/blocks";
import "blockly/msg/pt";

const pageElements = {
    blocklyArea: document.getElementById("blockly-area"),
    codeOutput: document.getElementById("code-output"),
    cliOutput: document.getElementById("cli-output"),
    runBtn: document.getElementById("run-btn"),
    clearBtn: document.getElementById("clear-btn"),
};

const OPTION_COLOR = "#7fbf7f";
const OPERAND_COLOR = "#a67f5f";
const GRID_BACKGROUND_COLOR = "#ccc";

const ls_definition = {
    command: "ls",
    name: "ls",
    description:
        "Lista o conteúdo de diretórios. Mostra informações sobre arquivos e pastas.",
    color: "#5b80a5",

    options: [
        {
            flag: "-l",
            description: "Usa o formato de listagem longa, mostrando detalhes.",
            takesArgument: false,
        },
        {
            flag: "-a",
            longFlag: "--all",
            description:
                "Mostra todas as entradas, incluindo as ocultas (que começam com '.').",
            takesArgument: false,
        },
        {
            flag: "-h",
            longFlag: "--human-readable",
            description:
                "Com -l, mostra os tamanhos de forma legível (ex: 1K, 234M, 2G).",
            takesArgument: false,
        },
        {
            flag: "-t",
            description:
                "Ordena pela data de modificação, com os mais recentes primeiro.",
            takesArgument: false,
        },
        {
            flag: "-S",
            description: "Ordena por tamanho de arquivo, com os maiores primeiro.",
            takesArgument: false,
        },
        {
            flag: "-r",
            longFlag: "--reverse",
            description: "Inverte a ordem da ordenação.",
            takesArgument: false,
        },
        {
            flag: "-R",
            longFlag: "--recursive",
            description: "Lista os subdiretórios recursivamente.",
            takesArgument: false,
        },
    ],

    exclusiveOptions: [["-t", "-S"]],

    operands: [
        {
            name: "file",
            description: "Um arquivo específico a ser listado.",
            type: "file",
            defaultValue: "arquivo.txt",
            cardinality: { min: 0, max: "unlimited" },
            validations: [
                {
                    regex: "^[^/\\0;]*$",
                    errorMessage: "Nome de arquivo inválido (não pode conter '/').",
                },
            ],
        },
        {
            name: "folder",
            description:
                "Um diretório a ser listado. Se omitido, usa o diretório atual.",
            type: "folder",
            defaultValue: ".",
            cardinality: { min: 0, max: "unlimited" },
            validations: [
                {
                    regex: "^[^;\\0]*$",
                    errorMessage: "Caminho de pasta contém caracteres inválidos.",
                },
            ],
        },
    ],
};

//TODO: diferenciar um name (apresentável) de um id (técnico interno) no JSON para operands
const global_cli_definitions = { commands: [ls_definition] };

function showToast(message, duration = 1500) {
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        padding: 8px 12px;
        background-color: #333;
        color: #fff;
        border-radius: 4px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        font-family: monospace;
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: 9999;
    `;
    const workspaceContainer = workspace.getParentSvg().parentNode;
    workspaceContainer.appendChild(toast);

    requestAnimationFrame(() => (toast.style.opacity = "1"));
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.addEventListener("transitionend", () => toast.remove());
    }, duration);
}

function getBlocksList(firstBlock) {
    const blocks = [];
    for (let current = firstBlock; current; current = current.getNextBlock()) {
        blocks.push(current);
    }
    return blocks;
}

function unplugDuplicatesFromList(blocks, valueFn) {
    const seen = new Set();
    for (const block of blocks) {
        const value = valueFn(block);
        if (seen.has(value)) {
            block.unplug(true);
            showToast(`Opção "${value}" removida por duplicata`);
            return;
        }
        seen.add(value);
    }
}

function createBlocksFromDefinition(definition) {
    Blockly.Blocks[definition.command] = {
        init: function() {
            this.appendDummyInput().appendField(definition.command);
            this.appendStatementInput("OPTIONS")
                .setCheck(`${definition.command}_Option`)
                .appendField("Opções:");
            this.appendStatementInput("OPERANDS")
                .setCheck(`${definition.command}_Operand`)
                .appendField("Operandos:");
            this.setPreviousStatement(true, "command");
            this.setNextStatement(true, "command");
            this.setColour(definition.color);
            this.setTooltip(definition.description);

            this.setOnChange(() => {
                const firstOption = this.getInputTargetBlock("OPTIONS");
                if (!firstOption) return;
                const blocksList = getBlocksList(firstOption).filter(
                    (block) => block.type === `${definition.command}_option`,
                );
                unplugDuplicatesFromList(blocksList, (block) =>
                    block.getFieldValue("FLAG"),
                );
            });
        },
    };

    Blockly.Blocks[`${definition.command}_option`] = {
        init: function() {
            this.appendDummyInput().appendField(
                new Blockly.FieldDropdown(
                    definition.options.map((option) => [
                        option.description,
                        `${option.flag} | ${option.longFlag}`,
                    ]),
                ),
                "FLAG",
            );
            this.setPreviousStatement(true, `${definition.name}_Option`);
            this.setNextStatement(true, `${definition.name}_Option`);
            this.setColour(OPTION_COLOR);
            this.setTooltip(
                `Opção (flag) para ${definition.name}. Pode ser encadeada com outras opções.`,
            );
        },
    };

    for (const operand of definition.operands) {
        Blockly.Blocks[`${definition.name}_${operand.name}_operand`] = {
            init: function() {
                const field = new Blockly.FieldTextInput(operand.defaultValue || "");
                field.setValidator((text) => {
                    for (const validation of operand.validations) {
                        if (!new RegExp(validation.regex).test(text)) {
                            this.setWarningText(validation.errorMessage);
                            return null;
                        }
                    }
                    this.setWarningText(null);
                    return text;
                });
                this.appendDummyInput()
                    .appendField(`${operand.name}:`)
                    .appendField(field, "VALUE");
                this.setPreviousStatement(true, `${definition.command}_Operand`);
                this.setNextStatement(true, `${definition.command}_Operand`);
                this.setColour(OPERAND_COLOR);
                this.setTooltip(operand.description);
            },
        };
    }
}

function createToolBoxCategoryFromDefininion(definition) {
    const blockContent = (type) => ({ kind: "block", type: type });
    return {
        kind: "category",
        name: definition.command,
        colour: definition.color,
        contents: [
            blockContent(definition.name),
            blockContent(`${definition.name}_option`),
            ...definition.operands.map((operand) =>
                blockContent(`${definition.name}_${operand.name}_operand`),
            ),
        ],
    };
}

function createToolbox(cli_definitions) {
    return {
        kind: "categoryToolbox",
        contents: cli_definitions.commands.map((def) =>
            createToolBoxCategoryFromDefininion(def),
        ),
    };
}

function getBlocklyOptions(cli_definitions) {
    return {
        toolbox: createToolbox(cli_definitions),
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
            colour: GRID_BACKGROUND_COLOR,
            snap: true,
        },
    };
}

for (const definition of global_cli_definitions.commands) {
    createBlocksFromDefinition(definition);
}

const workspace = Blockly.inject(
    pageElements.blocklyArea,
    getBlocklyOptions(global_cli_definitions),
);
