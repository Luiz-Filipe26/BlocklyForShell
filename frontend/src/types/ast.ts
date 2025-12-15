export type SemanticNodeKind =
    | "script"
    | "command"
    | "option"
    | "operand"
    | "operator"
    | "control";

export interface SemanticBinding {
    key: string;
    source: "field" | "input";
    name: string;
}

export interface SemanticData {
    nodeType: SemanticNodeKind;
    name: string;
    bindings: SemanticBinding[];
}

export interface ScriptSemanticData extends SemanticData {
    nodeType: "script";
}

export interface ASTField {
    name: string;
    value: string;
}

export interface ASTInput {
    name: string;
    children: ASTNode[];
}

export interface ASTNode {
    name: string;
    fields: ASTField[];
    inputs: ASTInput[];
    semanticData?: SemanticData;
}

export interface AST extends ASTNode {
    semanticData: ScriptSemanticData
}
