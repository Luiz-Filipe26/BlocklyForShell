import * as CLI from "@/types/cli";
import * as API from "@/types/api";
import * as Logger from "@/app/systemLogger";

const STORAGE_KEYS = {
    DEFINITIONS: "cli_definitions_v2",
    LEVELS: "game_levels_v2",
} as const;

const API_URL = "http://localhost:7000/api";

const API_ENDPOINTS = {
    DEFINITIONS: "definitions",
    GAME_DATA: "game-data",
} as const;

interface StoredResource<T> {
    origin: "user" | "backend";
    data: T;
    lastUpdated: number;
}

export async function getDefinitions(): Promise<CLI.CliDefinitions | null> {
    return await resolveResource<CLI.CliDefinitions>(
        API_ENDPOINTS.DEFINITIONS,
        STORAGE_KEYS.DEFINITIONS,
        "definições",
    );
}

export function saveCustomDefinitions(definitions: CLI.CliDefinitions): void {
    const resource: StoredResource<CLI.CliDefinitions> = {
        origin: "user",
        data: definitions,
        lastUpdated: Date.now(),
    };
    saveToStorage(STORAGE_KEYS.DEFINITIONS, resource);
    Logger.log(
        "Definições personalizadas salvas com sucesso.",
        Logger.LogLevel.INFO,
    );
}

export async function resetDefinitions(): Promise<CLI.CliDefinitions | null> {
    localStorage.removeItem(STORAGE_KEYS.DEFINITIONS);
    Logger.log(
        "Definições locais excluídas. Restaurando padrão do servidor...",
        Logger.LogLevel.WARN,
    );
    return await getDefinitions();
}

export async function getGameData(): Promise<API.GameData | null> {
    return await resolveResource<API.GameData>(
        API_ENDPOINTS.GAME_DATA,
        STORAGE_KEYS.LEVELS,
        "níveis",
    );
}

export function saveCustomGameData(data: API.GameData): void {
    const resource: StoredResource<API.GameData> = {
        origin: "user",
        data: data,
        lastUpdated: Date.now(),
    };
    saveToStorage(STORAGE_KEYS.LEVELS, resource);
    Logger.log(
        "Níveis personalizados salvos com sucesso.",
        Logger.LogLevel.INFO,
    );
}

export async function resetGameData(): Promise<API.GameData | null> {
    localStorage.removeItem(STORAGE_KEYS.LEVELS);
    Logger.log(
        "Níveis locais excluídos. Restaurando padrão do servidor...",
        Logger.LogLevel.WARN,
    );
    return await getGameData();
}

async function resolveResource<T>(
    endpoint: string,
    storageKey: string,
    label: string,
): Promise<T | null> {
    const stored = loadFromStorage<StoredResource<T>>(storageKey);
    const userData = checkUserOverride(stored, label);
    if (userData) return userData;
    const backendData = await fetchFromBackend<T>(endpoint, storageKey);
    if (backendData) return backendData;
    return tryOfflineFallback(stored, label);
}

function checkUserOverride<T>(
    stored: StoredResource<T> | null,
    label: string,
): T | null {
    if (stored?.origin === "user") {
        Logger.log(
            `Usando ${label} personalizadas (Salvas pelo usuário).`,
            Logger.LogLevel.INFO,
        );
        return stored.data;
    }
    return null;
}

async function fetchFromBackend<T>(
    endpoint: string,
    storageKey: string,
): Promise<T | null> {
    try {
        const response = await fetch(`${API_URL}/${endpoint}`);
        if (!response.ok) throw new Error(`Status ${response.status}`);

        const data = await response.json();

        saveToStorage(storageKey, {
            origin: "backend",
            data: data,
            lastUpdated: Date.now(),
        } as StoredResource<T>);

        return data;
    } catch (error) {
        return null;
    }
}

function tryOfflineFallback<T>(
    stored: StoredResource<T> | null,
    label: string,
): T | null {
    if (stored) {
        Logger.log(
            `Backend indisponível. Usando cópia local de ${label}.`,
            Logger.LogLevel.WARN,
        );
        return stored.data;
    }

    Logger.log(
        `Falha crítica ao carregar ${label}: Backend offline e sem dados locais.`,
        Logger.LogLevel.ERROR,
    );
    return null;
}

function loadFromStorage<T>(key: string): T | null {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as T;
    } catch (e) {
        console.warn(`Dados corrompidos em ${key}. Limpando armazenamento.`);
        localStorage.removeItem(key);
        return null;
    }
}

function saveToStorage(key: string, data: unknown): void {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        Logger.log(
            "Erro ao gravar no armazenamento local.",
            Logger.LogLevel.ERROR,
        );
    }
}
