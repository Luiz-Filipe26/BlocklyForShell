import * as Blockly from "blockly/core";
import type * as AST from "../types/ast";
import { getBlockSemanticData } from "./metadataManager.ts";

const IGNORED_FIELDS = ["CARDINALITY_ICON", "PARENT_INDICATOR"];

/**
 * Serializa o workspace inteiro, começando pelo bloco 'script_root'.
 * Retorna um objeto AST (Abstract Syntax Tree) pronto para o backend.
 */
export function serializeWorkspaceToAST(workspace: Blockly.WorkspaceSvg): AST.AST | null {
    const topBlocks = workspace.getTopBlocks(false);
    const rootBlock = topBlocks.find((block) => block.type === "script_root");

    if (!rootBlock) return null;

    const firstCommandBlock = rootBlock.getInputTargetBlock("STACK");

    return {
        nodeType: "script",
        fields: [],
        inputs: firstCommandBlock
            ? [
                {
                    name: "commands",
                    children: serializeStack(firstCommandBlock),
                },
            ]
            : [],
    };
}

/**
 * Percorre uma pilha vertical de blocos (conexões Next/Previous).
 * Retorna um array de objetos serializados.
 */
function serializeStack(startBlock: Blockly.Block | null): AST.ASTNode[] {
    const list: AST.ASTNode[] = [];
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
 * Serializa um bloco em um objeto de dados puro (AST Node).
 *
 * A função é intencionalmente genérica quanto ao tipo de bloco.
 * Usa o WeakMap para recuperar os metadados semânticos (semanticData),
 * que o Backend Java interpretará posteriormente.
 *
 * Estrutura de saída:
 * {
 *   fields: [...],
 *   inputs: [...],
 *   // Metadados essenciais usados pelo Backend Java para mapear o nó a um comando do Shell.
 *   semanticData: { ... }
 * }
 */

function serializeBlock(block: Blockly.Block): AST.ASTNode {
    const semanticData = getBlockSemanticData(block);

    const fields: AST.ASTField[] = [];
    block.inputList.forEach((input) => {
        input.fieldRow.forEach((field) => {
            if (field.name && field.getValue && !IGNORED_FIELDS.includes(field.name)) {
                fields.push({
                    name: field.name,
                    value: String(field.getValue()),
                });
            }
        });
    });

    const inputs: AST.ASTInput[] = [];
    block.inputList.forEach((input) => {
        if (!input.connection) return;

        const targetBlock = input.connection.targetBlock();
        inputs.push({
            name: input.name,
            children: targetBlock ? serializeStack(targetBlock) : [],
        });
    });

    const node: AST.ASTNode = {
        nodeType: semanticData?.nodeType,
        fields,
        inputs,
    };

    if (semanticData) {
        // Anexa diretamente os dados semânticos do bloco ao nó AST.
        node.semanticData = semanticData;
    }

    return node;
}
