import * as Blockly from "blockly";
import type * as AST from "@/types/ast";
import { getBlockSemanticData } from "./metadataManager";
import { findScriptRoot } from "@/blockly/blocks/systemBlocks";

const IGNORED_FIELDS = ["CARDINALITY_ICON", "PARENT_INDICATOR"];

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
                    children: serializeVerticalChain(firstCommandBlock),
                },
            ]
            : [],
    };
}

/**
 * Processamento sequencial
 * Percorre a lista ligada vertical (Next Block) iterativamente.
 */
function serializeVerticalChain(
    startBlock: Blockly.Block | null,
): AST.ASTNode[] {
    const list: AST.ASTNode[] = [];
    let currentBlock = startBlock;

    while (currentBlock) {
        if (currentBlock.isEnabled()) list.push(serializeNode(currentBlock));

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
    const { nodeType, semanticData } = resolveNodeSemantics(block);

    const node: AST.ASTNode = {
        nodeType,
        fields,
        inputs,
    };

    if (semanticData) {
        node.semanticData = semanticData;
    }

    return node;
}

function resolveNodeSemantics(block: Blockly.Block): {
    nodeType: string;
    semanticData?: Omit<AST.BlockSemanticData, "nodeType">;
} {
    const rawData = getBlockSemanticData(block);

    if (!rawData) {
        return { nodeType: "unknown" };
    }

    const { nodeType, ...semanticAttributes } = rawData;

    return {
        nodeType,
        semanticData: semanticAttributes,
    };
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
                    name: name,
                    value: String(value),
                });
            }
        });
    });

    return fields;
}
