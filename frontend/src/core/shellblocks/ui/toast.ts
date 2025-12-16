import { LogLevel } from "../types/logger";
import "./toast.css";
import * as Blockly from "blockly";
import { Assets } from "../constants/Assets";

export function showToast(
    workspace: Blockly.WorkspaceSvg,
    message: string,
    logLevel: LogLevel = LogLevel.INFO,
    duration = 5000,
): void {
    if (!workspace) return;

    const toast = document.createElement("div");
    toast.className = "toast-message";

    let iconHtml = "";
    const iconPath =
        logLevel === LogLevel.WARN
            ? Assets.Icons.Warning
            : logLevel === LogLevel.ERROR
                ? Assets.Icons.Error
                : "";
    if (iconPath)
        iconHtml = `<img src="${iconPath}" class="toast-icon" alt="${logLevel} icon" />`;
    toast.innerHTML = `${iconHtml}<span class="toast-text">${message}</span>`;

    const workspaceContainer = workspace.getParentSvg().parentNode;
    workspaceContainer?.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.opacity = "1";
    });

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.addEventListener("transitionend", () => toast.remove());
    }, duration);
}
