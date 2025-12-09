export interface CLIValidation {
    regex: string;
    errorMessage: string;
}

export interface CLICardinality {
    min: number;
    max: number | "unlimited";
}

export interface CLIOperand {
    id: string;
    label: string;
    description: string;
    color: string;
    type: "file" | "folder" | "string";
    defaultValue: string;
    cardinality?: CLICardinality;
    validations: CLIValidation[];
}

export interface CLIOption {
    flag: string;
    longFlag?: string;
    description: string;
    takesArgument: boolean;
}

export interface CLICommand {
    id: string;
    shellCommand: string;
    label: string;
    description: string;
    color: string;
    optionColor: string;
    options: CLIOption[];
    optionsMin?: number;
    exclusiveOptions?: string[][];
    operands: CLIOperand[];
    operandsMin?: number;
}

export interface CLIControlSlot {
    name: string;
    type: "statement";
    check: "command";
    label?: string;
    symbol?: string;
    symbolPlacement?: "before" | "after";
    syntaxPrefix?: string;
    obligatory?: boolean;
}

export interface CLIOperator {
    id: string;
    label: string;
    description: string;
    color: string;
    slots: CLIControlSlot[];
    slotsWithImplicitData?: string[];
}

export interface CLIControl {
    id: string;
    shellCommand: string;
    label: string;
    description: string;
    color: string;
    syntaxEnd: string;
    slots: CLIControlSlot[];
}

export interface CLICategory {
    name: string;
    commands: string[];
}

export interface CliDefinitions {
    commands: CLICommand[];
    operators?: CLIOperator[];
    controls?: CLIControl[];
    categories: CLICategory[];
}
