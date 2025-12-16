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

export interface SemanticControlSlot {
    name: string;
    syntaxPrefix?: string | null;
    obligatory?: boolean;
}

export interface SemanticControlDefinition {
    syntaxEnd?: string | null;
    slots: SemanticControlSlot[];
}

export interface SemanticOperatorSlot {
    name: string;
    symbol?: string | null;
    symbolPlacement?: "before" | "after" | null;
}

export interface SemanticOperatorDefinition {
    slots: SemanticOperatorSlot[];
}

export interface SemanticData {
    nodeType: SemanticNodeKind;
    name: string;
    bindings: SemanticBinding[];

    definition?: {
        control?: SemanticControlDefinition;
        operator?: SemanticOperatorDefinition;
    };
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
    semanticData: SemanticData & { nodeType: "script" };
}
