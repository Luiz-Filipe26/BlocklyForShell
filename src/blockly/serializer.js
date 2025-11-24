import * as Blockly from "blockly/core";

/**
 * Serializa o workspace inteiro, começando pelo bloco 'script_root'.
 * Retorna um objeto AST (Abstract Syntax Tree) pronto para o backend.
 */
export function serializeWorkspaceToAST(workspace) {
    const topBlocks = workspace.getTopBlocks(false);
    const rootBlock = topBlocks.find((block) => block.type === "script_root");

    if (!rootBlock) return null;

    const firstCommandBlock = rootBlock.getInputTargetBlock("STACK");

    return {
        type: "script",
        commands: serializeStack(firstCommandBlock),
    };
}

/**
 * Percorre uma pilha vertical de blocos (conexões Next/Previous).
 * Retorna um array de objetos serializados.
 */
function serializeStack(startBlock) {
    const list = [];
    let currentBlock = startBlock;

    while (currentBlock) {
        if (currentBlock.isEnabled()) {
            list.push(serializeBlock(currentBlock));
        }
        currentBlock = currentBlock.getNextBlock();
    }

    return list;
}

/**
 * Serializa um único bloco transformando-o em um objeto de dados puro.
 *
 * Estrutura de Saída:
 * {
 * ...semanticData,  // (nodeType, commandName, etc - injetados na criação)
 * fields: { ... },  // Valores dos campos (FLAG: "-l", VALUE: "texto")
 * inputs: { ... }   // Blocos filhos organizados por input (OPTIONS: [...])
 * }
 */

// TODO: fazer o IGNORED_FIELDS funcionar
const IGNORED_FIELDS = ["CARDINALITY_ICON", "PARENT_INDICATOR"];

function serializeBlock(block) {
    const data = block.semanticData
        ? { ...block.semanticData }
        : { nodeType: "unknown", rawType: block.type };

    data.fields = {};
    data.inputs = {};

    block.inputList.forEach((input) => {
        input.fieldRow.forEach((field) => {
            if (field.name && field.getValue && !IGNORED_FIELDS.includes(field.name))
                data.fields[field.name] = field.getValue();
        });
    });

    block.inputList.forEach((input) => {
        if (!input.connection) return;

        const targetBlock = input.connection.targetBlock();

        if (targetBlock) {
            data.inputs[input.name] = serializeStack(targetBlock);
        } else {
            data.inputs[input.name] = [];
        }
    });

    return data;
}
