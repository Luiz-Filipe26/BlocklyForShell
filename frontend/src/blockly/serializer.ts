import * as Blockly from "blockly/core";
import type * as AST from "../types/ast";

interface BlockWithSemanticData extends Blockly.Block {
  semanticData?: AST.BlockSemanticData;
}

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
 * Serializa um único bloco transformando-o em um objeto de dados puro.
 *
 * Estrutura de Saída:
 * {
 *   nodeType: "command",
 *   commandName: "ls",
 *   fields: [
 *     { name: "FLAG", value: "-l" },
 *     { name: "VALUE", value: "texto" }
 *   ],
 *   inputs: [
 *     { name: "OPTIONS", children: [...] },
 *     { name: "OPERANDS", children: [...] }
 *   ]
 * }
 */
function serializeBlock(block: Blockly.Block): AST.ASTNode {
  const blockWithSemanticData = block as BlockWithSemanticData;
  const semanticData = blockWithSemanticData.semanticData;

  const fields: AST.ASTField[] = [];
  block.inputList.forEach((input) => {
    input.fieldRow.forEach((field) => {
      if (field.name && field.getValue && !IGNORED_FIELDS.includes(field.name)) {
        fields.push({
          name: field.name,
          value: field.getValue(),
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

  // Constrói um nó AST genérico e copia o `semanticData` (se existir)
  // sem interpretar campos específicos do domínio. Mantemos o serializador
  // intencionalmente "burro"/agnóstico: ele apenas transpõe dados do bloco
  // para o nó AST, sem tentar transformar em estruturas específicas de CLI.
  const node: AST.ASTNode = {
    nodeType: semanticData?.nodeType,
    fields,
    inputs,
  };

  if (semanticData) {
    // Anexa diretamente os dados semânticos do bloco ao nó AST.
    // Quem precisar interpretar esses dados (por exemplo, um transformador
    // que converta o AST cru em um AST específico de CLI) fará validações
    // e transformações depois.
    node.semanticData = semanticData;
  }

  return node;
}
