import * as Blockly from "blockly";
import { LogLevel } from "@/types/logger";
import { coreLog } from "../services/logging";
import { getWorkspaceFromBlocks } from "../helpers/blockTraversal";

interface LocalChangeHandler {
    (block: Blockly.Block): void;
}

const blockHandlersMap = new WeakMap<Blockly.Block, LocalChangeHandler[]>();

export function addLocalChangeListener(
    block: Blockly.Block,
    listenerFunction: LocalChangeHandler,
): void {
    let handlers = blockHandlersMap.get(block);
    if (handlers) {
        handlers.push(listenerFunction);
        return;
    }

    blockHandlersMap.set(block, [listenerFunction]);
    const workspace = getWorkspaceFromBlocks(block);

    block.setOnChange(() => {
        const currentHandlers = blockHandlersMap.get(block);
        for (const handler of currentHandlers || []) {
            try {
                handler(block);
            } catch (error) {
                if (!workspace) continue;
                coreLog(workspace, `Erro em change-handler: ${error}`, LogLevel.ERROR);
            }
        }
    });
}

export function removeLocalChangeListener(
    block: Blockly.Block,
    listenerFunction: LocalChangeHandler,
): void {
    const handlers = blockHandlersMap.get(block);
    if (!handlers) return;
    const newHandlers = handlers.filter((handler) => handler !== listenerFunction);
    blockHandlersMap.set(block, newHandlers);
}
