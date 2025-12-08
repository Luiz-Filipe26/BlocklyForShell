import type { CliDefinitions } from "../types/cli";

let currentHelpBalloon: HTMLDivElement | null = null;

/**
 * Mostra um balão de ajuda posicionado ao lado de um elemento SVG.
 */
export function showHelpBalloon(
    baloonHtml: string,
    sourceElement: SVGElement,
): void {
    if (currentHelpBalloon) {
        currentHelpBalloon.remove();
        currentHelpBalloon = null;
    }

    const balloon = document.createElement("div");
    balloon.className = "help-balloon";
    balloon.innerHTML = baloonHtml;
    document.body.appendChild(balloon);
    currentHelpBalloon = balloon;

    const rect = sourceElement.getBoundingClientRect();
    balloon.style.left = `${window.scrollX + rect.right + 5}px`;
    balloon.style.top = `${window.scrollY + rect.top}px`;

    const closeListener = (event: Event): void => {
        const target = event.target as Node;
        if (currentHelpBalloon?.contains(target)) return;
        if (sourceElement.contains(target)) return;
        currentHelpBalloon?.remove();
        currentHelpBalloon = null;
        document.removeEventListener("click", closeListener, true);
    };

    // Evita fechar o balão no mesmo clique que o abriu
    requestAnimationFrame(() =>
        document.addEventListener("click", closeListener, true),
    );
}

export function buildCommandHelpHTML(
    commandDefinition: CliDefinitions["commands"][number],
): string {
    let html = `
        <h3>${commandDefinition.presentationName}</h3>
        <p>${commandDefinition.description}</p>
        <strong>Opções disponíveis:</strong>
        <ul style="margin-left:20px; list-style-type:disc;">
    `;

    for (const option of commandDefinition.options) {
        const longFlag = option.longFlag ? ` (${option.longFlag})` : "";
        html += `
            <li>
                <strong>${option.flag}</strong>${longFlag}:
                ${option.description}
            </li>
        `;
    }

    return html + "</ul>";
}
