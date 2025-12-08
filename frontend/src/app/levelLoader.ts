import { GameData, Level } from "../types/api";
import { log, LogLevel, LogMode } from "./systemLogger";

let currentLevelId: string | null = null;

export function getCurrentLevelId(): string | null {
    return currentLevelId;
}

export async function setupLevelSelector(
    levelSelect: HTMLSelectElement,
    levelDescription: HTMLDivElement,
): Promise<void> {
    const data = await fetchGameData();

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

async function fetchGameData(): Promise<GameData | null> {
    try {
        const response = await fetch("http://localhost:7000/api/game-data");

        if (!response.ok) {
            log(
                "Falha ao buscar níveis.",
                LogLevel.ERROR,
                LogMode.ToastAndConsole,
            );
            return null;
        }

        return response.json();
    } catch (err) {
        log(
            "Erro de conexão ao buscar níveis.",
            LogLevel.ERROR,
            LogMode.ToastAndConsole,
        );
        return null;
    }
}

function getSortedLevels(gameData: GameData): Level[] {
    const levelsMap = new Map(gameData.levels.map((l) => [l.id, l]));
    return gameData.levelOrder
        .map((id) => levelsMap.get(id))
        .filter((level): level is Level => level !== undefined);
}

function buildSandboxOption(): HTMLOptionElement {
    const option = document.createElement("option");
    option.value = "";
    option.text = "🛠️ Modo Livre (Sandbox)";
    option.dataset.description =
        "Ambiente livre. Crie scripts à vontade sem objetivos específicos.";
    return option;
}

function buildLevelOptions(levels: Level[]): HTMLOptionElement[] {
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
