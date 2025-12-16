export enum LogLevel {
    INFO = "info",
    WARN = "warn",
    ERROR = "error",
}
export type LogFunction = (message: string, level: LogLevel) => void;
