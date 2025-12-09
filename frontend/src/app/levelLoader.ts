import * as API from "@/types/api";
import { getGameData } from "./dataManager";

let currentLevelId: string | null = null;

export function getCurrentLevelId(): string | null {
    return currentLevelId;
}

export async function setupLevelSelector(
    levelSelect: HTMLSelectElement,
    levelDescription: HTMLDivElement,
): Promise<void> {
    const data = await getGameData();

    if (!data) {
        levelSelect.innerHTML = "<option>Erro ao carregar níveis</option>";
        levelDescription.textContent =
            "Não foi possível conectar ao servidor para buscar os níveis.";
        return;
    }

    const levels = getSortedLevels(data);

    levelSelect.innerHTML = "";
    const options = [buildSandboxOption(), ...buildLevelOptions(levels)];
    options.forEach((option) => levelSelect.appendChild(option));

    registerLevelSelectorEvents(levelSelect, levelDescription);

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
    option.text = "🛠️ Modo Livre (Sandbox)";
    option.dataset.description =
        "Ambiente livre. Crie scripts à vontade sem objetivos específicos.";
    return option;
}

function buildLevelOptions(levels: API.Level[]): HTMLOptionElement[] {
    return levels.map((level, index) => {
        const option = document.createElement("option");
        option.value = level.id;
        option.text = `Nível ${index + 1}: ${level.title}`;
        option.dataset.description = level.description ?? "";
        return option;
    });
}

function registerLevelSelectorEvents(
    selectElement: HTMLSelectElement,
    descriptionElement: HTMLDivElement,
) {
    selectElement.addEventListener("change", () => {
        currentLevelId = selectElement.value || null;
        updateLevelDescription(
            selectElement.selectedOptions[0],
            descriptionElement,
        );
    });
}

function updateLevelDescription(
    selectedOption: HTMLOptionElement | undefined,
    descriptionElement: HTMLDivElement,
) {
    if (!selectedOption) {
        descriptionElement.textContent = "";
        return;
    }

    descriptionElement.textContent = selectedOption.dataset.description || "";
}
