import type { AST } from "./ast";

export interface GeneratedScript {
    script: string;
}

export interface ExecutionResult {
    stdout: string;
    stderr: string;
    exitCode: number;
}

export interface Level {
    id: string;
    title: string;
    summary?: string;
    fullGuideHtml?: string;
}

export interface GameData {
    levels: Level[];
    levelOrder: string[];
}

export interface RunRequest {
    ast: AST | null;
    levelId: string | null;
}
