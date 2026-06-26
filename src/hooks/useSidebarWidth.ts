import { useCallback, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";

const STORAGE_KEY = "phoenix-sidebar-width";
const MIN_WIDTH = 220;
const MAX_WIDTH = 360;
const DEFAULT_WIDTH = 280;

function readStoredWidth(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_WIDTH;
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed)) return DEFAULT_WIDTH;
    return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, parsed));
  } catch {
    return DEFAULT_WIDTH;
  }
}

export function useSidebarWidth() {
  const [width, setWidth] = useState(readStoredWidth);
  const widthRef = useRef(width);
  widthRef.current = width;

  const persistWidth = useCallback((nextWidth: number) => {
    try {
      localStorage.setItem(STORAGE_KEY, String(nextWidth));
    } catch {
      // Ignore storage failures in restricted environments.
    }
  }, []);

  const startResize = useCallback(
    (event: ReactMouseEvent) => {
      event.preventDefault();
      const startX = event.clientX;
      const startWidth = widthRef.current;

      const onMove = (moveEvent: MouseEvent) => {
        const next = Math.min(
          MAX_WIDTH,
          Math.max(MIN_WIDTH, startWidth + moveEvent.clientX - startX),
        );
        setWidth(next);
      };

      const onUp = () => {
        persistWidth(widthRef.current);
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [persistWidth],
  );

  return { width, startResize, minWidth: MIN_WIDTH, maxWidth: MAX_WIDTH };
}
