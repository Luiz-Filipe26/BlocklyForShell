import * as Blockly from "blockly";

export function showToast(
    workspace: Blockly.WorkspaceSvg,
    message: string,
    duration = 5000,
): void {
    if (!workspace) return;

    const toast = document.createElement("div");
    toast.className = "toast-message";
    toast.textContent = message;

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
