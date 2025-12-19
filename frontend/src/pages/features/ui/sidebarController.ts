import * as PersistenceManager from "../session/persistenceManager";

export function setupSidebarToggle(
    toggleBtn: HTMLButtonElement,
    sidebar: HTMLElement,
): void {
    const getScreenSize = () =>
        getComputedStyle(document.documentElement)
            .getPropertyValue("--is-small-screen")
            .trim() === "1"
            ? "small"
            : "big";

    let lastSize = getScreenSize();
    let userChoiceSmall: boolean | null = null;
    let userChoiceBig: boolean | null = null;

    const triggerResize = () => window.dispatchEvent(new Event("resize"));

    if (lastSize === "small" || PersistenceManager.isSidebarCollapsed()) {
        sidebar.classList.add("is-collapsed");
    }

    window.addEventListener("resize", () => {
        const currentSize = getScreenSize();
        if (currentSize !== lastSize) {
            const shouldCollapse =
                currentSize === "small"
                    ? (userChoiceSmall ?? true)
                    : (userChoiceBig ??
                        PersistenceManager.isSidebarCollapsed());

            sidebar.classList.toggle("is-collapsed", shouldCollapse);
            lastSize = currentSize;
            triggerResize();
        }
    });

    const handleToggle = (forceExpand = false) => {
        const nowCollapsed = forceExpand
            ? false
            : !sidebar.classList.contains("is-collapsed");
        sidebar.classList.toggle("is-collapsed", nowCollapsed);

        if (getScreenSize() === "small") {
            userChoiceSmall = nowCollapsed;
        } else {
            userChoiceBig = nowCollapsed;
            PersistenceManager.saveSidebarCollapsed(nowCollapsed);
        }
        triggerResize();
    };

    toggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        handleToggle();
    });

    sidebar.addEventListener("click", () => {
        if (sidebar.classList.contains("is-collapsed")) handleToggle(true);
    });

    sidebar.addEventListener("transitionend", (e: TransitionEvent) => {
        if (e.propertyName === "width") triggerResize();
    });
}
