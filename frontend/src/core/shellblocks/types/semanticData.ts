export interface Binding {
    key: string;
    source: "field" | "input";
    name: string;
}

export interface SemanticControlSlot {
    name: string;
    syntaxPrefix?: string | null;
    obligatory?: boolean;
    breakLineBefore?: boolean;
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

export interface BaseSemanticData {
    nodeType: string;
    name: string;
    bindings: Binding[];
}

export interface StructuralSemanticData extends BaseSemanticData {
    nodeType: "script" | "command" | "option" | "operand";
    bindings: (Binding & {
        key: "commands" | "options" | "operands" | "flag" | "value";
    })[];
}

export interface DynamicSemanticData extends BaseSemanticData {
    definition: Record<string, Record<string, any>>;
}

export interface ControlSemanticData extends DynamicSemanticData {
    nodeType: "control";
    definition: { control: SemanticControlDefinition };
}

export interface OperatorSemanticData extends DynamicSemanticData {
    nodeType: "operator";
    definition: { operator: SemanticOperatorDefinition };
}

export type SemanticData =
    | StructuralSemanticData
    | ControlSemanticData
    | OperatorSemanticData;
