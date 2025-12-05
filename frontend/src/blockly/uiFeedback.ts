import * as Blockly from "blockly";
import type { CliDefinitions } from "../types/cli";

let currentHelpBalloon: HTMLDivElement | null = null;

/**
 * Mostra uma notificação "toast" no canto da área de trabalho.
 * @param workspace O workspace principal do Blockly.
 * @param message O texto a ser exibido.
 * @param duration A duração em milissegundos.
 */
export function showToast(
    workspace: Blockly.WorkspaceSvg,
    message: string,
    duration = 5000
): void {
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        padding: 8px 12px;
        background-color: #333;
        color: #fff;
        border-radius: 4px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        font-family: monospace;
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: 9999;
    `;
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

/**
 * Mostra um balão de ajuda posicionado ao lado de um elemento SVG.
 * @param text O texto da descrição.
 * @param sourceElement O elemento SVG (o ícone) que o balão deve seguir.
 */
export function showHelpBalloon(text: string, sourceElement: SVGElement): void {
    if (currentHelpBalloon) {
        currentHelpBalloon.remove();
        currentHelpBalloon = null;
    }

    const balloon = document.createElement("div");
    balloon.className = "help-balloon";
    balloon.innerHTML = text;
    document.body.appendChild(balloon);
    currentHelpBalloon = balloon;

    const rect = sourceElement.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    balloon.style.left = `${scrollX + rect.right + 5}px`;
    balloon.style.top = `${scrollY + rect.top}px`;

    const closeListener = (event: Event): void => {
        if (currentHelpBalloon && currentHelpBalloon.contains(event.target as Node)) {
            return;
        }
        if (sourceElement.contains(event.target as Node)) {
            return;
        }
        if (currentHelpBalloon) {
            currentHelpBalloon.remove();
            currentHelpBalloon = null;
        }
        document.removeEventListener("click", closeListener, true);
    };

    setTimeout(() => {
        document.addEventListener("click", closeListener, true);
    }, 0);
}

export function buildCommandHelpHTML(
    commandDefinition: CliDefinitions["commands"][number]
): string {
    let html = `
        <h3>${commandDefinition.presentationName}</h3>
        <p>${commandDefinition.description}</p>
        <strong>Opções disponíveis:</strong>
        <ul style="margin-left:20px; list-style-type:disc;">
    `;

    for (const optionDefinition of commandDefinition.options) {
        const longFlagSuffix = optionDefinition.longFlag
            ? ` (${optionDefinition.longFlag})`
            : "";

        html += `
            <li>
                <strong>${optionDefinition.flag}</strong>${longFlagSuffix}:
                ${optionDefinition.description}
            </li>
        `;
    }

    return html + "</ul>";
}
