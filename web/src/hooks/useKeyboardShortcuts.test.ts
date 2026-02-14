import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";
import { useSettingsStore } from "@/stores";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

function renderUseKeyboardShortcuts() {
  return renderHook(() => useKeyboardShortcuts());
}

describe("useKeyboardShortcuts", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    useSettingsStore.setState({ sidebarCollapsed: false });
  });

  it("should toggle sidebar on Ctrl+B", () => {
    renderUseKeyboardShortcuts();

    const event = new KeyboardEvent("keydown", {
      key: "b",
      ctrlKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(useSettingsStore.getState().sidebarCollapsed).toBe(true);
  });

  it("should toggle sidebar on Cmd+B (metaKey)", () => {
    renderUseKeyboardShortcuts();

    const event = new KeyboardEvent("keydown", {
      key: "b",
      metaKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(useSettingsStore.getState().sidebarCollapsed).toBe(true);
  });

  it("should navigate to equity calculator on Ctrl+1", () => {
    renderUseKeyboardShortcuts();

    const event = new KeyboardEvent("keydown", {
      key: "1",
      ctrlKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(mockNavigate).toHaveBeenCalledWith("/equity-calculator");
  });

  it("should navigate to record hand on Ctrl+2", () => {
    renderUseKeyboardShortcuts();

    const event = new KeyboardEvent("keydown", {
      key: "2",
      ctrlKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(mockNavigate).toHaveBeenCalledWith("/hands/record");
  });

  it("should navigate to hand library on Ctrl+3", () => {
    renderUseKeyboardShortcuts();

    const event = new KeyboardEvent("keydown", {
      key: "3",
      ctrlKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(mockNavigate).toHaveBeenCalledWith("/hands/library");
  });

  it("should navigate to hand replayer on Ctrl+4", () => {
    renderUseKeyboardShortcuts();

    const event = new KeyboardEvent("keydown", {
      key: "4",
      ctrlKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(mockNavigate).toHaveBeenCalledWith("/hands/replay");
  });

  it("should not trigger shortcuts when typing in input field", () => {
    renderUseKeyboardShortcuts();

    const input = document.createElement("input");
    document.body.appendChild(input);

    const event = new KeyboardEvent("keydown", {
      key: "1",
      ctrlKey: true,
      bubbles: true,
    });
    Object.defineProperty(event, "target", {
      writable: false,
      value: input,
    });
    window.dispatchEvent(event);

    expect(mockNavigate).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it("should not trigger shortcuts when typing in textarea", () => {
    renderUseKeyboardShortcuts();

    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);

    const event = new KeyboardEvent("keydown", {
      key: "b",
      ctrlKey: true,
      bubbles: true,
    });
    Object.defineProperty(event, "target", {
      writable: false,
      value: textarea,
    });
    window.dispatchEvent(event);

    expect(useSettingsStore.getState().sidebarCollapsed).toBe(false);

    document.body.removeChild(textarea);
  });

  it("should not trigger shortcuts when typing in select element", () => {
    renderUseKeyboardShortcuts();

    const select = document.createElement("select");
    document.body.appendChild(select);

    const event = new KeyboardEvent("keydown", {
      key: "1",
      ctrlKey: true,
      bubbles: true,
    });
    Object.defineProperty(event, "target", {
      writable: false,
      value: select,
    });
    window.dispatchEvent(event);

    expect(mockNavigate).not.toHaveBeenCalled();

    document.body.removeChild(select);
  });

  it("should not trigger shortcuts when typing in contenteditable element", () => {
    renderUseKeyboardShortcuts();

    const div = document.createElement("div");
    div.contentEditable = "true";
    document.body.appendChild(div);

    const event = new KeyboardEvent("keydown", {
      key: "1",
      ctrlKey: true,
      bubbles: true,
    });
    Object.defineProperty(event, "target", {
      writable: false,
      value: div,
    });
    window.dispatchEvent(event);

    expect(mockNavigate).not.toHaveBeenCalled();

    document.body.removeChild(div);
  });

  it("should not trigger shortcuts when typing in element with textbox role", () => {
    renderUseKeyboardShortcuts();

    const div = document.createElement("div");
    div.setAttribute("role", "textbox");
    document.body.appendChild(div);

    const event = new KeyboardEvent("keydown", {
      key: "1",
      ctrlKey: true,
      bubbles: true,
    });
    Object.defineProperty(event, "target", {
      writable: false,
      value: div,
    });
    window.dispatchEvent(event);

    expect(mockNavigate).not.toHaveBeenCalled();

    document.body.removeChild(div);
  });
});
