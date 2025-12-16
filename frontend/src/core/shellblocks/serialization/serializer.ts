import * as Blockly from "blockly";
import * as BlockIDs from "../constants/blockIds";
import type * as AST from "../types/ast";
import { getBlockSemanticData } from "./metadataManager";
import { findScriptRoot } from "../blocks/systemBlocks";

const IGNORED_FIELDS: string[] = [
    BlockIDs.FIELDS.CARDINALITY_ICON,
    BlockIDs.FIELDS.PARENT_INDICATOR,
];

export function serializeWorkspaceToAST(
    workspace: Blockly.WorkspaceSvg,
): AST.AST | null {
    const rootBlock = findScriptRoot(workspace);
    if (!rootBlock) return null;

    const ast = serializeNode(rootBlock);
    return ast.semanticData?.nodeType == "script" ? (ast as AST.AST) : null;
}

/**
 * Processamento sequencial
 * Percorre a lista ligada vertical (Next Block) iterativamente.
 */
function serializeVerticalChain(startBlock: Blockly.Block): AST.ASTNode[] {
    const list: AST.ASTNode[] = [];
    let currentBlock: Blockly.Block | null = startBlock;

    while (currentBlock) {
        if (currentBlock.isEnabled()) {
            list.push(serializeNode(currentBlock));
        }
        currentBlock = currentBlock.getNextBlock();
    }

    return list;
}

/**
 * Processamento recursivo em profundidade
 * Serializa um único nó e seus inputs aninhados.
 */
function serializeNode(block: Blockly.Block): AST.ASTNode {
    const fields = extractBlockFields(block);
    const inputs = extractBlockInputs(block);
    const semanticData = getBlockSemanticData(block);

    const node: AST.ASTNode = {
        name: block.type,
        fields,
        inputs,
    };

    if (semanticData) {
        node.semanticData = semanticData;
    }

    return node;
}

function extractBlockInputs(block: Blockly.Block): AST.ASTInput[] {
    const inputs: AST.ASTInput[] = [];

    block.inputList.forEach((input) => {
        if (!input.connection) return;

        const targetBlock = input.connection.targetBlock();

        inputs.push({
            name: input.name,
            children: targetBlock ? serializeVerticalChain(targetBlock) : [],
        });
    });

    return inputs;
}

function extractBlockFields(block: Blockly.Block): AST.ASTField[] {
    const fields: AST.ASTField[] = [];

    block.inputList.forEach((input) => {
        input.fieldRow.forEach((field) => {
            const name = field.name;
            const value = field.getValue();

            if (name && value !== null && !IGNORED_FIELDS.includes(name)) {
                fields.push({
                    name,
                    value: String(value),
                });
            }
        });
    });

    return fields;
}
