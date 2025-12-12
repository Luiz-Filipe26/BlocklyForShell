export function setupHeaderBehavior(
    headerRoot: HTMLElement,
    toggleBtn: HTMLButtonElement,
): void {
    toggleBtn.addEventListener("click", () => {
        const isExpanded = headerRoot.classList.toggle("is-expanded");
        if (isExpanded) {
            toggleBtn.innerHTML = `<span class="btn-label">Fechar Guia</span> <span class="btn-icon">▲</span>`;
            toggleBtn.style.backgroundColor = "#0066cc";
            toggleBtn.style.color = "white";
        } else {
            toggleBtn.innerHTML = `<span class="btn-label">Guia Completo</span> <span class="btn-icon">▼</span>`;
            toggleBtn.style.backgroundColor = "transparent";
            toggleBtn.style.color = "#0066cc";
        }
    });
}
