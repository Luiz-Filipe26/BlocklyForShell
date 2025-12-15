import * as API from "@/types/api";
import { getGameData } from "./dataManager";

let currentLevelId: string | null = null;

export function getCurrentLevelId(): string | null {
    return currentLevelId;
}

/**
 * Configura o seletor de níveis e os painéis de descrição.
 * Recebe os elementos do DOM diretamente.
 */
export async function setupLevelSelector(
    levelSelect: HTMLSelectElement,
    summaryElement: HTMLElement,
    detailsElement: HTMLElement,
): Promise<void> {
    const data = await getGameData();

    if (!data) {
        levelSelect.innerHTML = "<option>Erro ao carregar níveis</option>";
        summaryElement.textContent = "Erro de conexão com o servidor.";
        detailsElement.innerHTML = "";
        return;
    }

    const levels = getSortedLevels(data);

    levelSelect.innerHTML = "";

    const options = [buildSandboxOption(), ...buildLevelOptions(levels)];

    options.forEach((option) => levelSelect.appendChild(option));

    registerLevelSelectorEvents(levelSelect, summaryElement, detailsElement);

    levelSelect.dispatchEvent(new Event("change"));
}

function getSortedLevels(gameData: API.GameData): API.Level[] {
    const levelsMap = new Map(gameData.levels.map((l) => [l.id, l]));
    return gameData.levelOrder
        .map((id) => levelsMap.get(id))
        .filter((level): level is API.Level => level !== undefined);
}

function buildSandboxOption(): HTMLOptionElement {
    const option = document.createElement("option");
    option.value = "";
    option.text = "Modo Livre (Sandbox)";

    option.dataset.summary = "Ambiente livre sem objetivos.";
    option.dataset.details = "<h1>Modo Livre</h1><p>Use este espaço para testar comandos e blocos livremente.</p>";

    return option;
}

function buildLevelOptions(levels: API.Level[]): HTMLOptionElement[] {
    return levels.map((level, index) => {
        const option = document.createElement("option");
        option.value = level.id;
        option.text = `Nível ${index + 1}: ${level.title}`;

        option.dataset.summary = level.summary || "";
        option.dataset.details = level.fullGuideHtml || `<p>${level.summary || ""}</p>`;

        return option;
    });
}

function registerLevelSelectorEvents(
    selectElement: HTMLSelectElement,
    summaryElement: HTMLElement,
    detailsElement: HTMLElement
) {
    selectElement.addEventListener("change", () => {
        currentLevelId = selectElement.value || null;

        const selectedOption = selectElement.selectedOptions[0];
        if (!selectedOption) return;

        // Atualiza a UI lendo do dataset da opção selecionada
        // .textContent para texto puro (segurança)
        summaryElement.textContent = selectedOption.dataset.summary || "";
        // .innerHTML para o guia rico (renderiza o HTML string)
        detailsElement.innerHTML = selectedOption.dataset.details || "";
    });
}
