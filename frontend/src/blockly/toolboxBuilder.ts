import type { CliDefinitions, CLICommand } from "../types/cli";

interface ToolboxSubcategoryContent {
  kind: "block";
  type: string;
}

interface ToolboxSubcategory {
  kind: "category";
  name: string;
  colour: string;
  contents: ToolboxSubcategoryContent[];
}

interface ToolboxCategory {
  kind: "category";
  name: string;
  contents: ToolboxSubcategory[];
}

interface ToolboxConfig {
  kind: "categoryToolbox";
  contents: ToolboxCategory[];
}

function createToolBoxSubcategory(definition: CLICommand): ToolboxSubcategory {
  return {
    kind: "category",
    name: definition.name,
    colour: definition.color,
    contents: [
      { kind: "block" as const, type: definition.name },
      { kind: "block" as const, type: `${definition.name}_option` },
      ...definition.operands.map((operand) => ({
        kind: "block" as const,
        type: `${definition.name}_${operand.name}_operand`,
      })),
    ],
  };
}

function createToolBoxSubcategories(
  map: Map<string, CLICommand>,
  names: string[],
): ToolboxSubcategory[] {
  return names
    .map((command) => map.get(command))
    .filter((def): def is CLICommand => Boolean(def))
    .map((definition) => createToolBoxSubcategory(definition));
}

export function createToolbox(cli_definitions: CliDefinitions): ToolboxConfig {
  const map = new Map(
    cli_definitions.commands.map((command) => [command.command, command]),
  );

  return {
    kind: "categoryToolbox",
    contents: cli_definitions.categories.map((category) => ({
      kind: "category",
      name: category.name,
      contents: createToolBoxSubcategories(map, category.commands),
    })),
  };
}
