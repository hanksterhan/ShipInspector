import { INITIAL_VIEWPORTS } from "storybook/viewport";
import type { Preview } from "@storybook/react-vite";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { mswLoader } from "msw-storybook-addon/csf3";
import { PageHeaderProvider } from "../src/app/PageHeaderContext";
import { handlers, startWorker } from "../src/storybook/mocks/network";
import { resetStory } from "../src/storybook/reset";
import "../src/styles/globals.css";

const preview: Preview = {
  loaders: [
    (context) => {
      const parameter = context.parameters.msw;
      const overrides = Array.isArray(parameter)
        ? parameter
        : Object.values(parameter?.handlers ?? {}).flat();
      return mswLoader(startWorker)({
        ...context,
        parameters: {
          ...context.parameters,
          msw: [
            ...overrides,
            ...handlers.filter((handler) => !overrides.includes(handler)),
          ],
        },
      });
    },
  ],
  parameters: {
    msw: handlers,
    layout: "padded",
    docs: { story: { inline: false } },
    controls: { expanded: true },
    viewport: { options: INITIAL_VIEWPORTS },
    a11y: { test: "error" },
    options: {
      storySort: {
        order: [
          "UI",
          "Icons",
          "Poker",
          "Recorder",
          "Library",
          "Replay",
          "Settings",
          "Shell",
          "Pages",
        ],
      },
    },
  },
  beforeEach: async () => {
    // Storybook 10.3.1 runStory skips its animation cleanup when addon afterEach
    // throws. Restore only that exact test style before the next story runs.
    for (const style of document.head.querySelectorAll("style")) {
      if (
        /^\*, \*:before, \*:after \{\s*animation-delay: 0s !important;\s*animation-direction: (reverse|normal) !important;\s*animation-play-state: paused !important;\s*transition: none !important;\s*\}$/.test(
          style.textContent?.trim() ?? "",
        )
      )
        style.remove();
    }
    if (
      import.meta.env.STORYBOOK_REDUCED_MOTION &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      throw new Error("Reduced-motion browser context is missing");
    await resetStory();
    return async () => {
      await resetStory();
    };
  },
  decorators: [
    (Story, context) => {
      const route = context.parameters.route ?? "/";
      const routePath = context.parameters.routePath ?? "*";
      return (
        <MemoryRouter key={context.id} initialEntries={[route]}>
          <PageHeaderProvider>
            <Routes>
              <Route
                path={routePath}
                element={
                  <div
                    id={context.parameters.shell ? undefined : "main-content"}
                    tabIndex={-1}
                  >
                    <Story />
                  </div>
                }
              />
              {routePath !== "*" && (
                <Route
                  path="*"
                  element={<div role="status">Navigation destination</div>}
                />
              )}
            </Routes>
          </PageHeaderProvider>
        </MemoryRouter>
      );
    },
  ],
};
export default preview;
