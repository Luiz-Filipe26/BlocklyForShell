import { SemanticData } from "./semanticData";

export interface ASTParameter {
    key: string;
    value: string;
    children: ASTNode[];
}

export interface ASTControlConfig {
    syntaxEnd?: string | null;
    slots: {
        key: string;
        syntaxPrefix?: string | null;
        obligatory?: boolean;
    }[];
}

export interface ASTOperatorConfig {
    slots: {
        key: string;
        symbol?: string | null;
        symbolPlacement?: "before" | "after" | null;
        breakLineBefore?: boolean;
    }[];
}

export interface ASTNode {
    type: SemanticData["nodeType"];
    name: string;
    parameters: ASTParameter[];
    controlConfig?: ASTControlConfig;
    operatorConfig?: ASTOperatorConfig;
}

export interface AST extends ASTNode {
    type: "script";
}
