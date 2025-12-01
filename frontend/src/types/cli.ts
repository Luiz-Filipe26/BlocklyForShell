export interface CLIValidation {
  regex: string;
  errorMessage: string;
}

export interface CLICardinality {
  min: number;
  max: number | "unlimited";
}

export interface CLIOperand {
  name: string;
  description: string;
  color: string;
  type: "file" | "folder" | "string";
  defaultValue: string;
  cardinality: CLICardinality;
  validations: CLIValidation[];
}

export interface CLIOption {
  flag: string;
  longFlag?: string;
  description: string;
  takesArgument: boolean;
}

export interface CLICommand {
  command: string;
  name: string;
  description: string;
  color: string;
  option_color: string;
  options: CLIOption[];
  optionsMin?: number;
  exclusiveOptions?: string[][];
  operands: CLIOperand[];
  operandsMin?: number;
}

export interface CLIOperator {
  id: string;
  command: string;
  name: string;
  description: string;
  color: string;
}

export interface CLIControlSlot {
  name: string;
  type: "statement";
  label: string;
  check: "command";
}

export interface CLIControl {
  id: string;
  command: string;
  name: string;
  description: string;
  color: string;
  slots: CLIControlSlot[];
}

export interface CLICategory {
  name: string;
  commands: string[];
}

export interface CliDefinitions {
  commands: CLICommand[];
  operators: CLIOperator[];
  controls: CLIControl[];
  categories: CLICategory[];
}