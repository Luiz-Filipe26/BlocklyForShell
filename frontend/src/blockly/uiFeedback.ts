import type { CliDefinitions } from "../types/cli";

let currentHelpBalloon: HTMLDivElement | null = null;

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
        if (
            currentHelpBalloon &&
            currentHelpBalloon.contains(event.target as Node)
        ) {
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
    commandDefinition: CliDefinitions["commands"][number],
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
