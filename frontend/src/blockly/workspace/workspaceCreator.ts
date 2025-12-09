import * as Blockly from "blockly";
import * as CLI from "@/types/cli";
import * as BlockIDs from "blockly/constants/blockIds";
import { createToolbox } from "./toolboxBuilder";
import { initSystemBlocks } from "@/blockly/blocks/systemBlocks";
import { disableOrphanBlocks } from "./orphanHandler";
import * as Logger from "@/app/systemLogger";
import { createAllBlocksFromDefinition } from "@/blockly/blocks/blocksBuilder";
import {
    AUTOSAVE_STORAGE_KEY,
    initAutoSaver,
    loadSession,
} from "@/app/workspaceAutoSaver";

interface RawCLICommand extends Omit<CLI.CLICommand, "id"> {
    id?: string;
}

interface RawCliDefinitions extends Omit<CLI.CliDefinitions, "commands"> {
    commands: RawCLICommand[];
}

export async function setupWorkspace(
    blocklyArea: HTMLDivElement,
): Promise<Blockly.WorkspaceSvg | null> {
    initSystemBlocks();
    const response = await fetch("http://localhost:7000/api/definitions");
    if (!response.ok) {
        Logger.log(
            `Falha crítica ao iniciar a aplicação. Backend não responde. Código: ${response.status}`,
            Logger.LogLevel.ERROR,
            Logger.LogMode.ToastAndConsole,
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
    const restored = loadSession(workspace);
    if (!restored) {
        createScriptRoot(workspace);
    }
    initAutoSaver(workspace);
    initCustomContextMenu();

    return workspace;
}

function getBlocklyOptions(
    cliDefinitions: CLI.CliDefinitions,
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

function normalizeCliDefinitions(raw: RawCliDefinitions): CLI.CliDefinitions {
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
    const rootBlock = workspace.newBlock(BlockIDs.ROOT_BLOCK_TYPE);
    rootBlock.initSvg();
    rootBlock.render();
    rootBlock.moveBy(50, 50);
}

function initCustomContextMenu(): void {
    const { registry, ScopeType } = Blockly.ContextMenuRegistry;

    if (registry.getItem(BlockIDs.CONTEXT_MENU_IDS.CLEAR_OPTION))
        registry.unregister(BlockIDs.CONTEXT_MENU_IDS.CLEAR_OPTION);

    registry.register({
        scopeType: ScopeType.WORKSPACE,
        weight: 0,
        id: BlockIDs.CONTEXT_MENU_IDS.CLEAR_OPTION,
        preconditionFn: () => "enabled",
        callback: (scope) => {
            const workspace = scope.workspace;
            if (!workspace) return;

            if (confirm("Tem certeza que deseja apagar todos os blocos?")) {
                Blockly.Events.disable();
                workspace.clear();
                Blockly.Events.enable();
                localStorage.removeItem(AUTOSAVE_STORAGE_KEY);
                createScriptRoot(workspace);
            }
        },
        displayText: "🗑️ Limpar e Resetar",
    });
}
