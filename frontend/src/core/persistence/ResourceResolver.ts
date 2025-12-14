import { LogLevel } from "@/types/logger";
import { executeWithTimeout, TimeoutError } from "../utils/async";

export type StrategyLogger = (message: string, level: LogLevel) => void;

interface StoredResource<T> {
    origin: "user" | "backend";
    data: T;
    lastUpdated: number;
}

export interface ResourceConfig {
    storageKey: string;
    endpoint: string;
    label: string;
}

/**
 * Serviço centralizado para a resolução e persistência de recursos.
 * Aplica uma estratégia de priorização (User Override, Rede, Cache)
 * para garantir a disponibilidade de dados no aplicativo.
 */
export class ResourceResolver {
    private readonly apiUrl: string;
    private readonly logger: StrategyLogger;
    private readonly requestTimeoutMs: number;

    constructor(
        apiUrl: string,
        requestTimeoutMs: number,
        logger: StrategyLogger,
    ) {
        this.apiUrl = apiUrl;
        this.requestTimeoutMs = requestTimeoutMs;
        this.logger = logger;
    }

    public async resolveResource<T>(config: ResourceConfig): Promise<T | null> {
        const stored = this.loadFromStorage<StoredResource<T>>(
            config.storageKey,
        );

        const userData = this.checkUserOverride(stored, config.label);
        if (userData) return userData;

        const backendData = await this.fetchFromBackend<T>(
            config.endpoint,
            config.storageKey,
        );
        if (backendData) return backendData;

        return this.tryOfflineFallback(stored, config.label);
    }

    public saveUserOverride<T>(config: ResourceConfig, data: T): void {
        const resource: StoredResource<T> = {
            origin: "user",
            data: data,
            lastUpdated: Date.now(),
        };
        this.saveToStorage(config.storageKey, resource);
        this.logger(
            `${config.label} personalizadas salvas com sucesso.`,
            LogLevel.INFO,
        );
    }

    public clearResource(config: ResourceConfig): void {
        try {
            window.localStorage.removeItem(config.storageKey);
        } catch (e) {
            this.logger(
                `Erro ao limpar o recurso local (${config.label}).`,
                LogLevel.ERROR,
            );
            return;
        }
        this.logger(
            `${config.label} locais excluídos com sucesso.`,
            LogLevel.WARN,
        );
    }

    private checkUserOverride<T>(
        stored: StoredResource<T> | null,
        label: string,
    ): T | null {
        if (stored?.origin === "user") {
            this.logger(
                `Usando ${label} personalizadas (Salvas pelo usuário).`,
                LogLevel.INFO,
            );
            return stored.data;
        }
        return null;
    }

    private async fetchFromBackend<T>(
        endpoint: string,
        storageKey: string,
    ): Promise<T | null> {
        const fullUrl = `${this.apiUrl}/${endpoint}`;

        try {
            const response = await executeWithTimeout(
                this.requestTimeoutMs,
                (signal) => fetch(fullUrl, { signal }),
            );

            if (!response.ok) throw new Error(`Status ${response.status}`);

            const data = await response.json();

            this.saveToStorage(storageKey, {
                origin: "backend",
                data: data,
                lastUpdated: Date.now(),
            } as StoredResource<T>);

            return data;
        } catch (error) {
            if (error instanceof TimeoutError) {
                this.logger(`Timeout: ${error.message}`, LogLevel.WARN);
            } else if (error instanceof Error) {
                this.logger(
                    `Falha na requisição a ${endpoint}: ${error.message}`,
                    LogLevel.WARN,
                );
            }

            return null;
        }
    }

    private tryOfflineFallback<T>(
        stored: StoredResource<T> | null,
        label: string,
    ): T | null {
        if (stored) {
            this.logger(
                `Backend indisponível. Usando cópia local de ${label}.`,
                LogLevel.WARN,
            );
            return stored.data;
        }

        this.logger(
            `Falha crítica ao carregar ${label}: Backend offline e sem dados locais.`,
            LogLevel.ERROR,
        );
        return null;
    }

    private loadFromStorage<T>(key: string): T | null {
        const raw = window.localStorage.getItem(key);
        if (!raw) return null;
        try {
            return JSON.parse(raw) as T;
        } catch (error) {
            this.logger(
                `Dados corrompidos em ${key}. Limpando armazenamento.`,
                LogLevel.WARN,
            );
            window.localStorage.removeItem(key);
            return null;
        }
    }

    private saveToStorage(key: string, data: unknown): void {
        try {
            window.localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            this.logger(
                "Erro ao gravar no armazenamento local (localStorage cheio?).",
                LogLevel.ERROR,
            );
        }
    }
}
