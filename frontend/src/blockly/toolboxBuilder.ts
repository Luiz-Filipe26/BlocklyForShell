import type {
    CliDefinitions,
    CLICommand,
    CLIControl,
    CLIOperator,
} from "../types/cli";

interface ToolboxBlock {
    kind: "block";
    type: string;
}

interface ToolboxCategory {
    kind: "category";
    name: string;
    colour?: string;
    contents: (ToolboxCategory | ToolboxBlock)[];
}

interface ToolboxConfig {
    kind: "categoryToolbox";
    contents: ToolboxCategory[];
}

type ToolboxItem = ToolboxCategory | ToolboxBlock;

/**
 * Transforma um Comando em uma Categoria (Pasta) contendo o comando e seus filhos.
 */
function transformCommandToCategory(def: CLICommand): ToolboxCategory {
    const contents: ToolboxBlock[] = [{ kind: "block", type: def.id }];

    contents.push({ kind: "block", type: `${def.id}_option` });

    def.operands.forEach((op) => {
        contents.push({
            kind: "block",
            type: `${def.id}_${op.name}_operand`,
        });
    });

    return {
        kind: "category",
        name: def.id,
        colour: def.color,
        contents,
    };
}

function transformSimpleToBlock(def: CLIControl | CLIOperator): ToolboxBlock {
    return {
        kind: "block",
        type: def.name,
    };
}

export function createToolbox(cli_definitions: CliDefinitions): ToolboxConfig {
    const itemRegistry = new Map<string, ToolboxItem>();

    cli_definitions.commands.forEach((command) => {
        itemRegistry.set(command.id, transformCommandToCategory(command));
    });

    cli_definitions.controls.forEach((control) => {
        itemRegistry.set(control.id, transformSimpleToBlock(control));
    });

    cli_definitions.operators.forEach((operation) => {
        itemRegistry.set(operation.id, transformSimpleToBlock(operation));
    });

    const categories: ToolboxCategory[] = cli_definitions.categories.map(
        (category) => {
            const contents = category.commands
                .map((id) => itemRegistry.get(id))
                .filter((item): item is ToolboxItem => item !== undefined);

            return {
                kind: "category",
                name: category.name,
                contents: contents,
            };
        },
    );

    return {
        kind: "categoryToolbox",
        contents: categories,
    };
}
