import * as CLI from "@/types/cli";
import * as BlockIDs from "@/blockly/constants/blockIds";

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

export function createToolbox(
    cliDefinitions: CLI.CliDefinitions,
): ToolboxConfig {
    const itemRegistry = new Map<string, ToolboxItem>();

    cliDefinitions.commands.forEach((command) => {
        itemRegistry.set(command.id, transformCommandToCategory(command));
    });

    cliDefinitions.controls?.forEach((control) => {
        itemRegistry.set(control.id, transformSimpleToBlock(control));
    });

    cliDefinitions.operators?.forEach((operation) => {
        itemRegistry.set(operation.id, transformSimpleToBlock(operation));
    });

    const categories: ToolboxCategory[] = cliDefinitions.categories.map(
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

/**
 * Transforma um Comando em uma Categoria (Pasta) contendo o comando e seus filhos.
 */
function transformCommandToCategory(
    commandDefinition: CLI.CLICommand,
): ToolboxCategory {
    return {
        kind: "category",
        name: commandDefinition.id,
        colour: commandDefinition.color,
        contents: [
            {
                kind: "block",
                type: BlockIDs.commandBlockType(commandDefinition),
            },
            ...(commandDefinition.options?.length
                ? [
                    {
                        kind: "block" as const,
                        type: BlockIDs.commandOptionBlockType(
                            commandDefinition,
                        ),
                    },
                ]
                : []),
            ...commandDefinition.operands.map((operand) => ({
                kind: "block" as const,
                type: BlockIDs.commandOperandBlockType(
                    commandDefinition,
                    operand,
                ),
            })),
        ],
    };
}

function transformSimpleToBlock(
    definition: CLI.CLIControl | CLI.CLIOperator,
): ToolboxBlock {
    const type =
        "slots" in definition
            ? BlockIDs.operatorBlockType(definition)
            : BlockIDs.controlBlockType(definition);

    return { kind: "block", type };
}
