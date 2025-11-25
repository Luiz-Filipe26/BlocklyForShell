function createToolBoxSubcategory(definition) {
    return {
        kind: "category",
        name: definition.name,
        colour: definition.color,
        contents: [
            { kind: "block", type: definition.name },
            { kind: "block", type: `${definition.name}_option` },
            ...definition.operands.map((operand) => ({
                kind: "block",
                type: `${definition.name}_${operand.name}_operand`,
            })),
        ],
    };
}

function createToolBoxSubcategories(map, names) {
    return names
        .map((command) => map.get(command))
        .filter(Boolean)
        .map((definition) => createToolBoxSubcategory(definition));
}

export function createToolbox(cli_definitions) {
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
