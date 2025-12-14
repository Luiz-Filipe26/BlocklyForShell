export class TimeoutError extends Error {
    constructor(limit: number) {
        super(`A operação excedeu o tempo limite de ${limit}ms`);
        this.name = "TimeoutError";
    }
}

export async function executeWithTimeout<T>(
    timeoutMs: number,
    task: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const result = await task(controller.signal);
        clearTimeout(id);
        return result;
    } catch (error) {
        clearTimeout(id);
        if (error instanceof DOMException && error.name === "AbortError") {
            throw new TimeoutError(timeoutMs);
        }
        throw error;
    }
}
