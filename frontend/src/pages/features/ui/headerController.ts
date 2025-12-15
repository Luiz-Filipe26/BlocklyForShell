import { LogLevel } from "@/types/logger";
import * as Logger from "./systemLogger";

export function setupHeaderBehavior(
    headerRoot: HTMLElement,
    toggleBtn: HTMLButtonElement,
): void {
    const labelElement = toggleBtn.querySelector(".btn-label");

    if (!labelElement) {
        Logger.log(
            "Erro: .btn-label não encontrado dentro do botão toggle.",
            LogLevel.ERROR,
        );
        return;
    }

    toggleBtn.addEventListener("click", () => {
        const isExpanded = headerRoot.classList.toggle("is-expanded");
        labelElement.textContent = isExpanded ? "Fechar Guia" : "Guia Completo";
    });
}
