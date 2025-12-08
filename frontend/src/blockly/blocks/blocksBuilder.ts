import { createCommandBlock } from "./commandBlocks";
import { createOptionBlock } from "./optionBlocks";
import { createOperandBlocks } from "./operandBlocks";
import type { CLICommand, CliDefinitions } from "../../types/cli";
import { createControlBlock } from "./controlBlocks";
import { createOperatorBlock } from "./operatorBlocks";

export function createBlocksFromCommandDefinition(
    commandDefinition: CLICommand,
): void {
    createCommandBlock(commandDefinition);
    createOptionBlock(commandDefinition);
    createOperandBlocks(commandDefinition);
}

export function createAllBlocksFromDefinition(cliDefinitions: CliDefinitions) {
    for (const definition of cliDefinitions.commands) {
        createBlocksFromCommandDefinition(definition);
    }

    for (const controlBlock of cliDefinitions.controls || []) {
        createControlBlock(controlBlock);
    }

    for (const operatorBlock of cliDefinitions.operators || []) {
        createOperatorBlock(operatorBlock);
    }
}
