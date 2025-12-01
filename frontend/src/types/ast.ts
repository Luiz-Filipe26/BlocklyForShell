export interface ASTField {
    name: string;
    value: string;
}

export interface ASTInput {
    name: string;
    children: ASTNode[];
}

export interface ASTBase {
    nodeType?: string;
    fields: ASTField[];
    inputs: ASTInput[];
}
export interface ASTNode {
    nodeType?: string;
    fields: ASTField[];
    inputs: ASTInput[];
    // Optional semantic data copied from the originating block (if any).
    semanticData?: BlockSemanticData;
}

export interface ScriptNode extends ASTNode {
    nodeType: "script";
}

export type AST = ScriptNode;

/* ============================================================
   SEMANTIC DATA (attached to Blockly blocks)
   ============================================================ */

export interface BlockSemanticDataCommand {
    nodeType: "command";
    commandName: string;
}

export interface BlockSemanticDataOperand {
    nodeType: "operand";
    operandName: string;
    operandType: string;
    relatedCommand: string;
}

export interface BlockSemanticDataOption {
    nodeType: "option";
    relatedCommand: string;
}

export type BlockSemanticData =
    | BlockSemanticDataCommand
    | BlockSemanticDataOperand
    | BlockSemanticDataOption;