import * as PersistenceManager from "../session/persistenceManager";

export function setupSidebarResizer(
    resizer: HTMLElement,
    sidebar: HTMLElement,
): void {
    let isResizing = false;
    let animationFrameId: number | null = null;
    let mouseOffset = 0;

    const savedWidth = PersistenceManager.getSidebarWidth();
    if (savedWidth) {
        document.documentElement.style.setProperty(
            "--sidebar-width",
            `${savedWidth}px`,
        );
    }

    const onMouseMove = (e: MouseEvent) => {
        if (!isResizing) return;
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(() => {
            const newWidth = window.innerWidth - e.clientX - mouseOffset;
            document.documentElement.style.setProperty(
                "--sidebar-width",
                `${newWidth}px`,
            );
        });
    };

    const onMouseUp = () => {
        isResizing = false;
        document.body.classList.remove("is-resizing");
        document.body.style.userSelect = "auto";
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        const finalWidth = sidebar.getBoundingClientRect().width;
        PersistenceManager.saveSidebarWidth(finalWidth);
        window.dispatchEvent(new Event("resize"));
    };

    resizer.addEventListener("mousedown", (e) => {
        isResizing = true;
        const currentWidth = sidebar.getBoundingClientRect().width;
        mouseOffset = window.innerWidth - e.clientX - currentWidth;
        document.body.classList.add("is-resizing");
        document.body.style.userSelect = "none";
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
    });
}
