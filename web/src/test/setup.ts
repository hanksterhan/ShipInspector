import "@testing-library/jest-dom/vitest";

// ResizeObserver is used by Radix UI (Slider, etc.) but not available in jsdom
if (typeof ResizeObserver === "undefined") {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
