import type { AST } from "./ast";

export interface ExecutionResult {
    stdout: string;
    stderr: string;
    exitCode: number;
}

export interface Level {
    id: string;
    title: string;
    description: string;
}

export interface GameData {
    levels: Level[];
    levelOrder: string[];
}

export interface RunRequest {
    ast: AST | null;
    levelId: string | null;
}
