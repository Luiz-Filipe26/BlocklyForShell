import * as Blockly from "blockly";
import { LogFunction, LogLevel } from "../types/logger";

const workspaceLoggers = new WeakMap<Blockly.Workspace, LogFunction>();

export function setLoggerForWorkspace(
    workspace: Blockly.Workspace,
    logger: LogFunction,
): void {
    workspaceLoggers.set(workspace, logger);
}

export function coreLog(
    workspace: Blockly.Workspace,
    message: string,
    level: LogLevel = LogLevel.INFO,
): void {
    const logger = workspaceLoggers.get(workspace);
    logger?.(message, level);
}
