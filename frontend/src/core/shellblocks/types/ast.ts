export type StructuralKey =
    | "commands"
    | "options"
    | "operands"
    | "flag"
    | "value";

export interface StructuralBinding {
    key: StructuralKey;
    source: "field" | "input";
    name: string;
}

export interface DynamicBinding {
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

export interface ScriptSemanticData {
    nodeType: "script";
    name: string;
    bindings: StructuralBinding[];
}

export interface CommandSemanticData {
    nodeType: "command";
    name: string;
    bindings: StructuralBinding[];
}

export interface OptionSemanticData {
    nodeType: "option";
    name: string;
    bindings: StructuralBinding[];
}

export interface OperandSemanticData {
    nodeType: "operand";
    name: string;
    bindings: StructuralBinding[];
}

export interface ControlSemanticData {
    nodeType: "control";
    name: string;
    bindings: DynamicBinding[];
    definition: {
        control: SemanticControlDefinition;
    };
}

export interface OperatorSemanticData {
    nodeType: "operator";
    name: string;
    bindings: DynamicBinding[];
    definition: {
        operator: SemanticOperatorDefinition;
    };
}

export type SemanticData =
    | ScriptSemanticData
    | CommandSemanticData
    | OptionSemanticData
    | OperandSemanticData
    | ControlSemanticData
    | OperatorSemanticData;

export type SemanticNodeKind = SemanticData["nodeType"];

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
    semanticData: ScriptSemanticData;
}
