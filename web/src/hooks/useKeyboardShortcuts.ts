import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSettingsStore } from "@/stores";

/**
 * Global keyboard shortcuts hook
 * - Ctrl+B / Cmd+B: Toggle sidebar
 * - Ctrl+1 / Cmd+1: Navigate to Equity Calculator
 * - Ctrl+2 / Cmd+2: Navigate to Record Hand
 * - Ctrl+3 / Cmd+3: Navigate to Hand Library
 * - Ctrl+4 / Cmd+4: Navigate to Hand Replayer
 * - Escape: Close modals (handled by shadcn Dialog/Sheet components)
 */
export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const toggleSidebar = useSettingsStore((s) => s.toggleSidebar);

  useEffect(() => {
    function isTextInput(target: EventTarget | null): boolean {
      if (!target || !(target instanceof HTMLElement)) {
        return false;
      }
      const tagName = target.tagName.toLowerCase();
      const isEditable = target.contentEditable === "true";
      const hasTextRole = target.getAttribute("role") === "textbox";
      return (
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        isEditable ||
        hasTextRole
      );
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (isTextInput(e.target)) return;

      const isMeta = e.metaKey || e.ctrlKey;

      if (isMeta && e.key === "b") {
        e.preventDefault();
        toggleSidebar();
      } else if (isMeta && e.key === "1") {
        e.preventDefault();
        navigate("/equity-calculator");
      } else if (isMeta && e.key === "2") {
        e.preventDefault();
        navigate("/hands/record");
      } else if (isMeta && e.key === "3") {
        e.preventDefault();
        navigate("/hands/library");
      } else if (isMeta && e.key === "4") {
        e.preventDefault();
        navigate("/hands/replay");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate, toggleSidebar]);
}
