import * as Blockly from "blockly";
import * as CLI from "@/types/cli";
import * as BlockIDs from "@/blockly/constants/blockIds";
import * as Logger from "@/app/systemLogger";
import { createToolbox } from "./toolboxBuilder";
import { initSystemBlocks } from "@/blockly/blocks/systemBlocks";
import { disableOrphanBlocks } from "./orphanHandler";
import { createAllBlocksFromDefinition } from "@/blockly/blocks/blocksBuilder";
import { getDefinitions } from "@/app/dataManager"; // ✅ Usa o DataManager
import {
    AUTOSAVE_STORAGE_KEY,
    initAutoSaver,
    loadSession,
} from "@/app/workspaceAutoSaver";

const FALLBACK_DEFINITIONS: CLI.CliDefinitions = {
    commands: [],
    categories: [
        {
            name: "Sistema Offline",
            commands: [],
        },
    ],
    operators: [],
    controls: [],
};

// --- Tipos Auxiliares para Normalização ---
interface RawCLICommand extends Omit<CLI.CLICommand, "id"> {
    id?: string;
}
interface RawCliDefinitions extends Omit<CLI.CliDefinitions, "commands"> {
    commands: RawCLICommand[];
}

/**
 * Inicializa o Workspace principal.
 */
export async function setupWorkspace(
    blocklyArea: HTMLDivElement,
): Promise<Blockly.WorkspaceSvg | null> {
    initSystemBlocks();
    let rawDefinitions = await getDefinitions();

    if (!rawDefinitions) {
        Logger.log(
            "Backend indisponível. Iniciando em Modo de Segurança.",
            Logger.LogLevel.WARN,
            Logger.LogMode.Console,
        );
        rawDefinitions = FALLBACK_DEFINITIONS;
    }

    const cliDefinitions = normalizeCliDefinitions(rawDefinitions);
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

/**
 * Responsável por aplicar novas definições e resetar o workspace.
 */
export function refreshWorkspaceDefinitions(
    workspace: Blockly.WorkspaceSvg,
    definitions: CLI.CliDefinitions,
): void {
    const normalizedDefs = normalizeCliDefinitions(definitions);
    createAllBlocksFromDefinition(normalizedDefs);
    const newToolbox = createToolbox(normalizedDefs);
    workspace.updateToolbox(newToolbox);
    Blockly.Events.disable();
    workspace.clear();
    createScriptRoot(workspace);
    Blockly.Events.enable();
}

/**
 * Cria o bloco raiz (script_root) no workspace.
 * Exportada para ser usada em resets manuais.
 */
export function createScriptRoot(workspace: Blockly.WorkspaceSvg): void {
    const rootBlock = workspace.newBlock(BlockIDs.ROOT_BLOCK_TYPE);
    rootBlock.initSvg();
    rootBlock.render();
    rootBlock.moveBy(50, 50);
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

function normalizeCliDefinitions(
    raw: RawCliDefinitions | CLI.CliDefinitions,
): CLI.CliDefinitions {
    const defs = raw as RawCliDefinitions;
    return {
        ...defs,
        commands: defs.commands.map((command) => ({
            ...command,
            id: command.id || command.shellCommand,
        })),
    };
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
            const workspace = scope.workspace as Blockly.WorkspaceSvg;
            if (!workspace) return;

            if (confirm("Tem certeza que deseja apagar todos os blocos?")) {
                Blockly.Events.disable();
                workspace.clear();
                localStorage.removeItem(AUTOSAVE_STORAGE_KEY);
                Blockly.Events.enable();

                createScriptRoot(workspace);
            }
        },
        displayText: "🗑️ Limpar e Resetar",
    });
}
