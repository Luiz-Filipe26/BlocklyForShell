import { Level } from "../types/api";

let currentLevelId: string | null = null;

export function getCurrentLevelId(): string | null {
    return currentLevelId;
}

export async function setupLevelSelector(
    levelSelect: HTMLSelectElement,
    levelDescription: HTMLDivElement,
) {
    try {
        const response = await fetch("http://localhost:7000/api/levels");
        if (!response.ok) throw new Error("Falha ao buscar níveis");

        const levels: Level[] = await response.json();

        levelSelect.innerHTML = "";

        const sandboxOption = document.createElement("option");
        sandboxOption.value = "";
        sandboxOption.text = "🛠️ Modo Livre (Sandbox)";
        levelSelect.appendChild(sandboxOption);

        levels.forEach((level) => {
            const option = document.createElement("option");
            option.value = level.id;
            option.text = `Level ${level.id}: ${level.title}`;
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
