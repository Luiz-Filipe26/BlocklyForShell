import * as CLI from "@/types/cli";
import * as API from "@/types/api";
import * as Logger from "@/app/systemLogger";

const KEYS = {
    DEFINITIONS: "cli_definitions_cache_v1",
    LEVELS: "game_levels_cache_v1",
} as const;

const API_URL = "http://localhost:7000/api";

/**
 * Obtém as definições CLI.
 * Prioridade: LocalStorage > Backend
 */
export async function getDefinitions(): Promise<CLI.CliDefinitions | null> {
    const cached = loadFromStorage<CLI.CliDefinitions>(KEYS.DEFINITIONS);
    if (cached) {
        Logger.log(
            "Usando definições personalizadas (Cache Local).",
            Logger.LogLevel.INFO,
        );
        return cached;
    }

    try {
        const response = await fetch(`${API_URL}/definitions`);
        if (!response.ok) throw new Error(`Status ${response.status}`);
        const data = await response.json();
        return data;
    } catch (error) {
        Logger.log(
            `Erro ao buscar definições no backend: ${error}`,
            Logger.LogLevel.ERROR,
        );
        return null;
    }
}

/**
 * Salva definições customizadas (Upload do usuário).
 */
export function saveCustomDefinitions(definitions: CLI.CliDefinitions): void {
    saveToStorage(KEYS.DEFINITIONS, definitions);
}

/**
 * Restaura para o padrão de fábrica (Backend).
 */
export async function resetDefinitions(): Promise<CLI.CliDefinitions | null> {
    localStorage.removeItem(KEYS.DEFINITIONS);
    Logger.log(
        "Definições locais removidas. Buscando padrão do servidor...",
        Logger.LogLevel.WARN,
    );
    return await getDefinitions();
}

/**
 * Obtém os dados do jogo (Níveis).
 * Prioridade: LocalStorage > Backend
 */
export async function getGameData(): Promise<API.GameData | null> {
    const cached = loadFromStorage<API.GameData>(KEYS.LEVELS);
    if (cached) {
        Logger.log(
            "Usando níveis personalizados (Cache Local).",
            Logger.LogLevel.INFO,
        );
        return cached;
    }

    try {
        const response = await fetch(`${API_URL}/game-data`);
        if (!response.ok) throw new Error(`Status ${response.status}`);
        return await response.json();
    } catch (error) {
        Logger.log(`Erro ao buscar níveis: ${error}`, Logger.LogLevel.ERROR);
        return null;
    }
}

export function saveCustomGameData(data: API.GameData): void {
    saveToStorage(KEYS.LEVELS, data);
}

export async function resetGameData(): Promise<API.GameData | null> {
    localStorage.removeItem(KEYS.LEVELS);
    return await getGameData();
}

function loadFromStorage<T>(key: string): T | null {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as T;
    } catch (e) {
        console.warn(`Cache corrompido para ${key}. Limpando.`);
        localStorage.removeItem(key);
        return null;
    }
}

function saveToStorage(key: string, data: unknown): void {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        Logger.log(
            "Erro ao salvar no armazenamento local (Quota excedida?)",
            Logger.LogLevel.ERROR,
        );
    }
}
