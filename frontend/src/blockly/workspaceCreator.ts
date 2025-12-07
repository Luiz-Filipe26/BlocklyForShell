import * as Blockly from "blockly";

import { createToolbox } from "./toolboxBuilder";
import type { CLICommand, CliDefinitions } from "../types/cli";
import { initSystemBlocks } from "./systemBlocks";
import { createBlocksFromDefinition } from "./blockBuilders";
import { createControlBlock } from "./controlBlocks";
import { createOperatorBlock } from "./operatorBlocks";
import { disableOrphanBlocks } from "./orphanHandler";

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

interface RawCLICommand extends Omit<CLICommand, "id"> {
    id?: string;
}

interface RawCliDefinitions extends Omit<CliDefinitions, "commands"> {
    commands: RawCLICommand[];
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

export async function createScriptRoot(
    workspace: Blockly.WorkspaceSvg,
): Promise<void> {
    const rootBlock = workspace.newBlock("script_root");
    rootBlock.initSvg();
    rootBlock.render();
    rootBlock.moveBy(50, 50);
}

function initCustomContextMenu(): void {
    const CLEAR_OPTION_ID = "workspace_clear_all_custom";

    try {
        Blockly.ContextMenuRegistry.registry.unregister(CLEAR_OPTION_ID);
    } catch (e) { }

    Blockly.ContextMenuRegistry.registry.register({
        displayText: "🗑️ Limpar e Resetar",
        preconditionFn: function() {
            return "enabled";
        },
        callback: function(scope) {
            const workspace = scope.workspace;
            if (!workspace) return;

            if (confirm("Tem certeza que deseja apagar todos os blocos?")) {
                workspace.clear();
                createScriptRoot(workspace);
            }
        },
        scopeType: Blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
        id: CLEAR_OPTION_ID,
        weight: 0,
    });
}

export async function setupWorkspace(
    blocklyArea: HTMLDivElement,
): Promise<Blockly.WorkspaceSvg | null> {
    let workspace: Blockly.WorkspaceSvg | null = null;
    initSystemBlocks();

    try {
        const response = await fetch("http://localhost:7000/api/definitions");
        if (!response.ok)
            throw new Error(`Erro na API Definitions: ${response.status}`);

        const rawJson = await response.json();
        const cliDefinitions = normalizeCliDefinitions(rawJson);

        for (const definition of cliDefinitions.commands) {
            createBlocksFromDefinition(definition);
        }

        if (cliDefinitions.controls) {
            for (const ctrl of cliDefinitions.controls) {
                createControlBlock(ctrl);
            }
        }

        if (cliDefinitions.operators) {
            for (const op of cliDefinitions.operators) {
                createOperatorBlock(op);
            }
        }

        workspace = Blockly.inject(
            blocklyArea,
            getBlocklyOptions(cliDefinitions),
        );

        disableOrphanBlocks(workspace);
        createScriptRoot(workspace);

        initCustomContextMenu();

        return workspace;
    } catch (error) {
        alert(
            "Falha crítica ao iniciar a aplicação. Verifique se o Backend está rodando.",
        );
        console.error(error);
    }
    return null;
}
