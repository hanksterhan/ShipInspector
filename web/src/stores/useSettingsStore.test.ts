import { describe, it, expect, beforeEach } from "vitest";
import { useSettingsStore } from "./useSettingsStore";

describe("useSettingsStore", () => {
  beforeEach(() => {
    useSettingsStore.getState().resetSettings();
    useSettingsStore.setState({ trayOpen: false });
  });

  it("has correct defaults", () => {
    const state = useSettingsStore.getState();
    expect(state.trayOpen).toBe(false);
    expect(state.cardSelectionMode).toBe("52 Cards");
  });

  it("toggles tray", () => {
    useSettingsStore.getState().toggleTray();
    expect(useSettingsStore.getState().trayOpen).toBe(true);
    useSettingsStore.getState().toggleTray();
    expect(useSettingsStore.getState().trayOpen).toBe(false);
  });

  it("sets tray open state", () => {
    useSettingsStore.getState().setTrayOpen(true);
    expect(useSettingsStore.getState().trayOpen).toBe(true);
  });

  it("sets card selection mode", () => {
    useSettingsStore.getState().setCardSelectionMode("Suit - Rank Selection");
    expect(useSettingsStore.getState().cardSelectionMode).toBe(
      "Suit - Rank Selection",
    );
  });

  it("resets settings to defaults", () => {
    useSettingsStore.getState().setCardSelectionMode("Rank - Suit Selection");
    useSettingsStore.getState().resetSettings();
    expect(useSettingsStore.getState().cardSelectionMode).toBe("52 Cards");
  });
});
