import { useEquityCalculatorStore } from "@/stores/useEquityCalculatorStore";
import { useHandRecorderStore } from "@/stores/useHandRecorderStore";
import { useHandReplayStore } from "@/stores/useHandReplayStore";
import { useHandLibraryStore } from "@/stores/useHandLibraryStore";
import { useHandLibraryFiltersStore } from "@/stores/useHandLibraryFiltersStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { setTokenProvider } from "@/services/httpClient";
import { setAuthState } from "./mocks/clerk";
import { clear } from "./mocks/storage";

export async function resetStory() {
  useEquityCalculatorStore.getState().dispose();
  useHandReplayStore.getState().dispose();
  // Let a private pending draft timer expire while hydration blocks its write.
  // No production export or persistent draft is needed for this sandbox.
  useHandRecorderStore.setState({ _isHydrating: true });
  await new Promise((resolve) => setTimeout(resolve, 550));
  await clear();
  useHandRecorderStore.setState(structuredCloneData(useHandRecorderStore.getInitialState()));
  useEquityCalculatorStore.setState(structuredCloneData(useEquityCalculatorStore.getInitialState()));
  useEquityCalculatorStore.getState().dispose();
  useSettingsStore.setState(structuredCloneData(useSettingsStore.getInitialState()));
  useHandLibraryStore.setState(structuredCloneData(useHandLibraryStore.getInitialState()));
  useHandLibraryFiltersStore.setState(structuredCloneData(useHandLibraryFiltersStore.getInitialState()));
  useHandReplayStore.setState(structuredCloneData(useHandReplayStore.getInitialState()));
  localStorage.removeItem("ship-inspector-settings");
  localStorage.removeItem("hand-library-filters");
  delete document.documentElement.dataset.inputMethod;
  setAuthState();
  setTokenProvider(async () => "storybook-token");
}

function structuredCloneData<T extends object>(state: T): T {
  return Object.fromEntries(Object.entries(state).map(([key, value]) => [key, typeof value === "function" ? value : structuredClone(value)])) as T;
}
