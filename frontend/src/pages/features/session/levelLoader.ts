import * as API from "@/types/api";
import * as ShellBlocks from "shellblocks";
import { getGameData } from "./dataManager";
import * as PersistenceManager from "./persistenceManager";
import * as Logger from "../ui/systemLogger";

export const SANDBOX_LEVEL_ID = "sandbox";

let levelsCache: Map<string, API.Level> = new Map();
let orderedLevels: API.Level[] = [];

let currentLevelId: string = SANDBOX_LEVEL_ID;

export function getCurrentLevelId(): string {
    return currentLevelId;
}

export function notifyLevelCompleted(levelId: string): void {
    if (levelId === SANDBOX_LEVEL_ID) return;

    const levelIndex = orderedLevels.findIndex((level) => level.id === levelId);
    if (levelIndex === -1) return;

    const progress = PersistenceManager.getExperimentProgress();
    if (levelIndex !== progress) return;

    PersistenceManager.unlockNextLevel();

    Logger.log(
        `Progresso atualizado: nível ${levelIndex + 1} concluído.`,
        ShellBlocks.LogLevel.INFO,
    );
}

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

    levelsCache.clear();
    orderedLevels = getSortedLevels(data);
    orderedLevels.forEach((level) => levelsCache.set(level.id, level));

    const unlockedCount = PersistenceManager.getExperimentProgress();

    levelSelect.innerHTML = "";

    levelSelect.appendChild(
        createOption(SANDBOX_LEVEL_ID, "Modo Livre (Sandbox)"),
    );

    orderedLevels.forEach((level, index) => {
        const option = createOption(
            level.id,
            `Nível ${index + 1}: ${level.title}`,
        );

        if (index > unlockedCount + 1) {
            option.disabled = true;
            option.text += " [BLOQUEADO]";
        }

        levelSelect.appendChild(option);
    });

    registerLevelSelectorEvents(levelSelect, summaryElement, detailsElement);

    levelSelect.value = SANDBOX_LEVEL_ID;
    levelSelect.dispatchEvent(new Event("change"));
}

function getSortedLevels(gameData: API.GameData): API.Level[] {
    const levelsMap = new Map(
        gameData.levels.map((level) => [level.id, level]),
    );
    return gameData.levelOrder
        .map((id) => levelsMap.get(id))
        .filter((level): level is API.Level => level !== undefined);
}

function createOption(value: string, text: string): HTMLOptionElement {
    const option = document.createElement("option");
    option.value = value;
    option.text = text;
    return option;
}

function registerLevelSelectorEvents(
    selectElement: HTMLSelectElement,
    summaryElement: HTMLElement,
    detailsElement: HTMLElement,
): void {
    selectElement.addEventListener("change", () => {
        currentLevelId = selectElement.value;

        if (currentLevelId === SANDBOX_LEVEL_ID) {
            renderSandboxMode(summaryElement, detailsElement);
            return;
        }

        const level = levelsCache.get(currentLevelId);
        if (level) {
            renderLevelMode(level, summaryElement, detailsElement);
        } else {
            renderErrorState(currentLevelId, summaryElement, detailsElement);
        }
    });
}

function renderSandboxMode(
    summaryElement: HTMLElement,
    detailsElement: HTMLElement,
): void {
    const badgeHtml = getBadgeHtml("sandbox");

    summaryElement.innerHTML = `
        <span class="summary-label">Ambiente livre sem objetivos.</span>
        ${badgeHtml}
    `;

    detailsElement.innerHTML = `
        <h1>Modo Livre</h1>
        <p>Use este espaço para testar comandos e blocos livremente.</p>
    `;
}

function renderLevelMode(
    level: API.Level,
    summaryElement: HTMLElement,
    detailsElement: HTMLElement,
): void {
    const difficulty = level.difficulty || "tutorial";
    const badgeHtml = getBadgeHtml(difficulty);

    summaryElement.innerHTML = `
        <span class="summary-label">${level.summary || ""}</span>
        ${badgeHtml}
    `;

    detailsElement.innerHTML = level.fullGuideHtml || `<p>${level.summary}</p>`;
}

function renderErrorState(
    invalidId: string,
    summaryElement: HTMLElement,
    detailsElement: HTMLElement,
): void {
    Logger.log(
        `Erro: nível (${invalidId}) não encontrado.`,
        ShellBlocks.LogLevel.ERROR,
    );
    summaryElement.textContent = "Erro ao carregar nível.";
    detailsElement.innerHTML = "";
}

function getBadgeHtml(
    inputDifficulty?: API.LevelDifficulty | "sandbox",
): string {
    if (!inputDifficulty) return "";

    let label = "TREINO";
    let cssClass = "badge-training";

    const difficulty = inputDifficulty.toLowerCase();

    if (difficulty === "tutorial") {
        label = "TUTORIAL";
        cssClass = "badge-tutorial";
    } else if (difficulty === "challenge") {
        label = "DESAFIO";
        cssClass = "badge-challenge";
    } else if (difficulty === "sandbox") {
        label = "MODO LIVRE";
        cssClass = "badge-sandbox";
    }

    return `<span class="difficulty-badge ${cssClass}">${label}</span>`;
}
