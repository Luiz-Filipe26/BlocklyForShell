import * as Blockly from "blockly";
import type * as AST from "../../types/ast";
import { getBlockSemanticData } from "./metadataManager";
import { findScriptRoot } from "../blocks/systemBlocks";

const IGNORED_FIELDS = ["CARDINALITY_ICON", "PARENT_INDICATOR"];

/**
 * Serializa o workspace inteiro, começando pelo bloco 'script_root'.
 * Retorna um objeto AST (Abstract Syntax Tree) pronto para o backend.
 */
export function serializeWorkspaceToAST(
    workspace: Blockly.WorkspaceSvg,
): AST.AST | null {
    const rootBlock = findScriptRoot(workspace);
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
 * Realiza a separação entre o nodeType (elevado para a raiz) e o restante
 * dos dados semânticos.
 */
function serializeBlock(block: Blockly.Block): AST.ASTNode {
    const rawSemanticData = getBlockSemanticData(block);

    const fields: AST.ASTField[] = [];
    block.inputList.forEach((input) => {
        input.fieldRow.forEach((field) => {
            if (
                field.name &&
                field.getValue &&
                !IGNORED_FIELDS.includes(field.name)
            ) {
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

    let nodeType = "unknown";
    let cleanedSemanticData:
        | Omit<AST.BlockSemanticData, "nodeType">
        | undefined;

    if (rawSemanticData) {
        const { nodeType: type, ...rest } = rawSemanticData;
        nodeType = type;
        cleanedSemanticData = rest;
    }

    const node: AST.ASTNode = {
        nodeType,
        fields,
        inputs,
    };

    if (cleanedSemanticData && Object.keys(cleanedSemanticData).length > 0) {
        node.semanticData = cleanedSemanticData;
    }

    return node;
}
