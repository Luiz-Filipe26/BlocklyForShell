import * as Blockly from "blockly";

export enum LogMode {
    Console,
    Toast,
    ToastAndConsole,
}

export enum LogLevel {
    INFO = "info",
    WARN = "warn",
    ERROR = "error",
}

let logContainer: HTMLDivElement | null = null;
let activeWorkspace: Blockly.WorkspaceSvg | null = null;

export function initSystemLogger(
    container: HTMLDivElement,
    workspace: Blockly.WorkspaceSvg,
): void {
    logContainer = container;
    activeWorkspace = workspace;
    log("Logger do Sistema inicializado.", LogLevel.INFO, LogMode.Console);
}

export function log(
    message: string,
    level: LogLevel = LogLevel.INFO,
    mode: LogMode = LogMode.Console,
    toastDuration = 5000,
): void {
    if (mode === LogMode.Console || mode === LogMode.ToastAndConsole) {
        writeToPanel(message, level);
    }

    if (mode === LogMode.Toast || mode === LogMode.ToastAndConsole) {
        const prefix =
            level === LogLevel.ERROR
                ? "❌ "
                : level === LogLevel.WARN
                    ? "⚠️ "
                    : "";
        showToast(`${prefix}${message}`, toastDuration);
    }
}

function showToast(message: string, duration = 5000): void {
    if (!activeWorkspace) return;

    const toast = document.createElement("div");
    toast.className = "toast-message";
    toast.textContent = message;

    const workspaceContainer = activeWorkspace.getParentSvg().parentNode;
    workspaceContainer?.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.opacity = "1";
    });

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.addEventListener("transitionend", () => toast.remove());
    }, duration);
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
