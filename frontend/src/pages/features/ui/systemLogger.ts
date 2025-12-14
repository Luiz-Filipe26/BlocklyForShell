import * as Blockly from "blockly";
import { LogLevel } from "@/types/logger";

let logContainer: HTMLDivElement | null = null;
let activeWorkspace: Blockly.WorkspaceSvg | null = null;

export function initSystemLogger(
    container: HTMLDivElement,
    workspace: Blockly.WorkspaceSvg | null,
): void {
    logContainer = container;
    activeWorkspace = workspace;
    log("Logger do Sistema inicializado.", LogLevel.INFO);
}

export function log(
    message: string,
    level: LogLevel = LogLevel.INFO,
): void {
    writeToPanel(message, level);
}

function writeToPanel(message: string, level: LogLevel): void {
    if (!logContainer) return;

    const entry = document.createElement("div");
    entry.classList.add("log-entry", level);

    const time = new Date().toLocaleTimeString("pt-BR", { hour12: false });

    entry.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-msg"></span>`;
    const msgSpan = entry.querySelector(".log-msg");
    if (msgSpan) msgSpan.textContent = message;

    logContainer.appendChild(entry);
    logContainer.scrollTop = logContainer.scrollHeight;
}
