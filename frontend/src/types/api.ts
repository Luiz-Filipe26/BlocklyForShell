import * as ShellBlocks from "shellblocks";

export interface GeneratedScript {
    script: string;
}

export interface ExecutionResult {
    stdout: string;
    stderr: string;
    exitCode: number;
}

export type LevelDifficulty = "tutorial" | "training" | "challenge";

export interface Level {
    id: string;
    title: string;
    summary?: string;
    fullGuideHtml?: string;
    difficulty?: LevelDifficulty;
}

export interface GameData {
    levels: Level[];
    levelOrder: string[];
}

export interface RunRequest {
    ast: ShellBlocks.AST.AST | null;
    level: Level | null;
}
