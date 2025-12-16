import * as ShellBlocks from "shellblocks";
import * as API from "@/types/api";
import * as Logger from "../ui/systemLogger";
import {
    ResourceResolver,
    ResourceConfig,
} from "@/core/persistence/ResourceResolver";
import { AppConfig } from "@/config/appConfig";
import { ApiRoutes } from "@/config/apiRoutes";

const STORAGE_KEYS = {
    DEFINITIONS: "cli_definitions_v1",
    LEVELS: "game_levels_v1",
} as const;

const DEFINITIONS_CONFIG: ResourceConfig = {
    endpoint: ApiRoutes.DEFINITIONS,
    storageKey: STORAGE_KEYS.DEFINITIONS,
    label: "Definições",
};

const GAME_DATA_CONFIG: ResourceConfig = {
    endpoint: ApiRoutes.GAME_DATA,
    storageKey: STORAGE_KEYS.LEVELS,
    label: "Níveis",
};

const resourceResolver = new ResourceResolver(
    AppConfig.API_BASE_URL,
    AppConfig.API_REQUEST_TIMEOUT_MS,
    Logger.log,
);

export async function getDefinitions(): Promise<ShellBlocks.CLI.CliDefinitions | null> {
    return await resourceResolver.resolveResource<ShellBlocks.CLI.CliDefinitions>(
        DEFINITIONS_CONFIG,
    );
}

export function saveCustomDefinitions(definitions: ShellBlocks.CLI.CliDefinitions): void {
    resourceResolver.saveUserOverride(DEFINITIONS_CONFIG, definitions);
}

export async function resetDefinitions(): Promise<ShellBlocks.CLI.CliDefinitions | null> {
    resourceResolver.clearResource(DEFINITIONS_CONFIG);
    Logger.log(
        "Definições locais excluídas. Restaurando padrão...",
        ShellBlocks.LogLevel.WARN,
    );
    return await getDefinitions();
}

export async function getGameData(): Promise<API.GameData | null> {
    return await resourceResolver.resolveResource<API.GameData>(
        GAME_DATA_CONFIG,
    );
}

export function saveCustomGameData(data: API.GameData): void {
    resourceResolver.saveUserOverride(GAME_DATA_CONFIG, data);
}

export async function resetGameData(): Promise<API.GameData | null> {
    resourceResolver.clearResource(GAME_DATA_CONFIG);
    Logger.log("Níveis locais excluídos. Restaurando padrão...", ShellBlocks.LogLevel.WARN);
    return await getGameData();
}
