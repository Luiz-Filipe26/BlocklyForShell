import { GameData, Level } from "../types/api";

let currentLevelId: string | null = null;

export function getCurrentLevelId(): string | null {
    return currentLevelId;
}

export async function setupLevelSelector(
    levelSelect: HTMLSelectElement,
    levelDescription: HTMLDivElement,
): Promise<void> {
    try {
        const response = await fetch("http://localhost:7000/api/game-data");
        if (!response.ok) throw new Error("Falha ao buscar níveis");

        const gameData: GameData = await response.json();

        const levelsMap = new Map(
            gameData.levels.map((level) => [level.id, level]),
        );

        const sortedLevels = gameData.levelOrder
            .map((id) => levelsMap.get(id))
            .filter((level): level is Level => level !== undefined);

        levelSelect.innerHTML = "";

        const sandboxOption = document.createElement("option");
        sandboxOption.value = "";
        sandboxOption.text = "🛠️ Modo Livre (Sandbox)";
        levelSelect.appendChild(sandboxOption);

        sortedLevels.forEach((level, index) => {
            const option = document.createElement("option");
            option.value = level.id;

            const visualIndex = index + 1;
            option.text = `Nível ${visualIndex}: ${level.title}`;

            option.dataset.description = level.description;
            levelSelect.appendChild(option);
        });

        levelSelect.addEventListener("change", () => {
            currentLevelId = levelSelect.value || null;

            if (currentLevelId) {
                const selectedOption = levelSelect.selectedOptions[0];
                levelDescription.textContent =
                    selectedOption.dataset.description || "";
            } else {
                levelDescription.textContent =
                    "Ambiente livre. Crie scripts à vontade sem objetivos específicos. O sistema será resetado a cada execução.";
            }
        });

        levelSelect.dispatchEvent(new Event("change"));
    } catch (error) {
        console.error("Erro ao carregar níveis:", error);
        levelSelect.innerHTML = "<option>Erro ao carregar níveis</option>";
        levelDescription.textContent =
            "Não foi possível conectar ao servidor para buscar os níveis.";
    }
}
