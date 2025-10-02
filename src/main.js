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

const LS_COLOR = "#5b80a5";
const OPTION_COLOR = "#7fbf7f";
const OPERAND_COLOR = "#a67f5f";
const GRID_BACKGROUND_COLOR = "#ccc";

const ls_definition = {
    command: "ls",
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
            name: "CAMINHO",
            description:
                "O arquivo ou diretório a ser listado. Se omitido, usa o diretório atual.",
            type: "path",
            cardinality: {
                min: 0,
                max: "unlimited", // Permite 'ls', 'ls /etc', 'ls /etc /home', etc.
            },
            validation: [
                {
                    regex: "^[^;\\0]*$", // Exemplo: não pode conter ';' ou o byte nulo
                    errorMessage: "O caminho contém caracteres inválidos.",
                },
            ],
        },
    ],
};

const cli_definitions = { commands: [ls_definition] };

function createToolBoxContentsFromDefininion(definition) {
    if (!definition || !Array.isArray(definition))
        showToast("Não foi provido lista de definições de CLI");

    Blockly.Blocks[definition.command] = {
        init: function() {
            this.appendDummyInput().appendField(definition.command);
            this.appendStatementInput("OPTIONS")
                .setCheck(`${definition.command}_Option`)
                .appendField("Opções:");
            this.appendStatementInput("OPERANDS")
                .setCheck(`${definition.command}_Operand`)
                .appendField("Operandos:");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
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
                new Blockly.FieldDropdown([
                    ["-a (inclui ocultos)", "-a"],
                    ["-l (detalhado)", "-l"],
                    ["-h (human readable)", "-h"],
                    ["-r (ordem reversa)", "-r"],
                    ["-t (por tempo)", "-t"],
                    ["-S (por tamanho)", "-S"],
                    ["-R (recursivo)", "-R"],
                ]),
                "FLAG",
            );
            this.setPreviousStatement(true, "Option");
            this.setNextStatement(true, "Option");
            this.setColour(OPTION_COLOR);
            this.setTooltip(
                "Opção (flag) para ls. Pode ser encadeada com outras opções.",
            );
        },
    };

    const blockContent = (type) => ({ kind: "block", type: type });
    return definition.map((def) => ({
        name: def.command,
        colour: def.color,
        contents: [
            blockContent(def.name),
            blockContent(`${def.name}"_option`),
            ...def.operands.map((operand) =>
                blockContent(`${def.name}_${operand.name}_${operand}`),
            ),
        ],
    }));
}

const workspace = Blockly.inject(pageElements.blocklyArea, getBlocklyOptions());

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

Blockly.Blocks["ls"] = {
    init: function() {
        this.appendDummyInput().appendField("ls");
        this.appendStatementInput("OPTIONS")
            .setCheck("Option")
            .appendField("Opções:");
        this.appendStatementInput("OPERANDS")
            .setCheck("Operand")
            .appendField("Operandos:");
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setColour(LS_COLOR);
        this.setTooltip(
            'Bloco ls — arraste blocos de opção na caixa "Opções" e operandos na caixa "Operandos".',
        );

        this.setOnChange(() => {
            const firstOption = this.getInputTargetBlock("OPTIONS");
            if (!firstOption) return;
            const blocksList = getBlocksList(firstOption).filter(
                (block) => block.type === "ls_option",
            );
            unplugDuplicatesFromList(blocksList, (block) =>
                block.getFieldValue("FLAG"),
            );
        });
    },
};

Blockly.Blocks["ls_option"] = {
    init: function() {
        this.appendDummyInput().appendField(
            new Blockly.FieldDropdown([
                ["-a (inclui ocultos)", "-a"],
                ["-l (detalhado)", "-l"],
                ["-h (human readable)", "-h"],
                ["-r (ordem reversa)", "-r"],
                ["-t (por tempo)", "-t"],
                ["-S (por tamanho)", "-S"],
                ["-R (recursivo)", "-R"],
            ]),
            "FLAG",
        );
        this.setPreviousStatement(true, "Option");
        this.setNextStatement(true, "Option");
        this.setColour(OPTION_COLOR);
        this.setTooltip(
            "Opção (flag) para ls. Pode ser encadeada com outras opções.",
        );
    },
};

Blockly.Blocks["ls_file_operand"] = {
    init: function() {
        this.appendDummyInput().appendField(
            new Blockly.FieldTextInput("arquivo.txt", function(text) {
                if (text.includes("/") || text.includes("\0")) return null;
                return text;
            }),
            "VALUE",
        );
        this.setPreviousStatement(true, "Operand");
        this.setNextStatement(true, "Operand");
        this.setColour(OPERAND_COLOR);
        this.setTooltip("Arquivo (Linux). Não pode conter / ou null byte.");
    },
};

Blockly.Blocks["ls_folder_operand"] = {
    init: function() {
        this.appendDummyInput().appendField(
            new Blockly.FieldTextInput("pasta/", function(text) {
                text = text.trim();
                if (text.includes("\0")) return null;
                if (/\/{2,}/.test(text) || text.split("/").some((part) => part === ""))
                    return null;
                if (!text.endsWith("/")) text += "/";
                return text;
            }),
            "VALUE",
        );
        this.setPreviousStatement(true, "Operand");
        this.setNextStatement(true, "Operand");
        this.setColour(OPERAND_COLOR);
        this.setTooltip("Pasta (Linux). Valida barra final e segmentos vazios.");
    },
};

function createLsToolBox() {
    return {
        kind: "category",
        name: "ls",
        colour: LS_COLOR,
        contents: [
            { kind: "block", type: "ls" },
            { kind: "block", type: "ls_option" },
            { kind: "block", type: "ls_file_operand" },
            { kind: "block", type: "ls_folder_operand" },
        ],
    };
}

function createToolbox() {
    return {
        kind: "categoryToolbox",
        contents: [createLsToolBox()],
    };
}

function getBlocklyOptions() {
    return {
        toolbox: createToolbox(),
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
