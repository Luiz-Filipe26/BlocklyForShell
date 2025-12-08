import * as Blockly from "blockly";

import { createToolbox } from "./toolboxBuilder";
import type { CLICommand, CliDefinitions } from "../../types/cli";
import {
    initSystemBlocks,
    SCRIPT_ROOT_BLOCK_TYPE,
} from "../blocks/systemBlocks";
import { disableOrphanBlocks } from "./orphanHandler";
import { log, LogLevel, LogMode } from "../../app/systemLogger";
import { createAllBlocksFromDefinition } from "../blocks/blocksBuilder";

interface RawCLICommand extends Omit<CLICommand, "id"> {
    id?: string;
}

interface RawCliDefinitions extends Omit<CliDefinitions, "commands"> {
    commands: RawCLICommand[];
}

export const CLEAR_OPTION_CONTEXT_MENU_ID = "workspace_clear_all_custom";

export async function setupWorkspace(
    blocklyArea: HTMLDivElement,
): Promise<Blockly.WorkspaceSvg | null> {
    initSystemBlocks();
    const response = await fetch("http://localhost:7000/api/definitions");
    if (!response.ok) {
        log(
            `Falha crítica ao iniciar a aplicação. Backend não responde. Código: ${response.status}`,
            LogLevel.ERROR,
            LogMode.ToastAndConsole,
        );
        return null;
    }

    const rawJson = await response.json();
    const cliDefinitions = normalizeCliDefinitions(rawJson);
    createAllBlocksFromDefinition(cliDefinitions);

    const workspace = Blockly.inject(
        blocklyArea,
        getBlocklyOptions(cliDefinitions),
    );

    disableOrphanBlocks(workspace);
    createScriptRoot(workspace);
    initCustomContextMenu();

    return workspace;
}

function getBlocklyOptions(
    cliDefinitions: CliDefinitions,
): Blockly.BlocklyOptions {
    return {
        toolbox: createToolbox(cliDefinitions),
        renderer: "zelos",
        trashcan: true,
        scrollbars: true,
        zoom: {
            controls: true,
            wheel: true,
            startScale: 0.9,
            maxScale: 3,
            minScale: 0.3,
            scaleSpeed: 1.2,
        },
        move: {
            scrollbars: true,
            drag: true,
            wheel: true,
        },
        grid: {
            spacing: 20,
            length: 3,
            colour: "#ccc",
            snap: true,
        },
    };
}

function normalizeCliDefinitions(raw: RawCliDefinitions): CliDefinitions {
    return {
        ...raw,
        commands: raw.commands.map((command) => ({
            ...command,
            id: command.id || command.shellCommand,
        })),
    };
}

async function createScriptRoot(
    workspace: Blockly.WorkspaceSvg,
): Promise<void> {
    const rootBlock = workspace.newBlock(SCRIPT_ROOT_BLOCK_TYPE);
    rootBlock.initSvg();
    rootBlock.render();
    rootBlock.moveBy(50, 50);
}

function initCustomContextMenu(): void {
    const { registry, ScopeType } = Blockly.ContextMenuRegistry;

    if (registry.getItem(CLEAR_OPTION_CONTEXT_MENU_ID))
        registry.unregister(CLEAR_OPTION_CONTEXT_MENU_ID);

    registry.register({
        scopeType: ScopeType.WORKSPACE,
        weight: 0,
        id: CLEAR_OPTION_CONTEXT_MENU_ID,
        preconditionFn: () => "enabled",
        callback: (scope) => {
            const workspace = scope.workspace;
            if (!workspace) return;

            if (confirm("Tem certeza que deseja apagar todos os blocos?")) {
                workspace.clear();
                createScriptRoot(workspace);
            }
        },
        displayText: "🗑️ Limpar e Resetar",
    });
}
