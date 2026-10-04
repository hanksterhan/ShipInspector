import type { Preview } from "@storybook/react-vite";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { mswLoader } from "msw-storybook-addon/csf3";
import { PageHeaderProvider } from "../src/app/PageHeaderContext";
import { handlers, startWorker } from "../src/storybook/mocks/network";
import { resetStory } from "../src/storybook/reset";
import "../src/styles/globals.css";

const preview: Preview = {
  loaders: [mswLoader(startWorker)],
  parameters: {
    msw: handlers,
    layout: "padded",
    docs: { story: { inline: false } },
    controls: { expanded: true },
    a11y: { test: "error" },
    options: { storySort: { order: ["UI", "Icons", "Poker", "Recorder", "Library", "Replay", "Settings", "Shell", "Pages"] } },
  },
  beforeEach: async () => {
    await resetStory();
    return async () => { await resetStory(); };
  },
  decorators: [(Story, context) => {
    const route = context.parameters.route ?? "/";
    const routePath = context.parameters.routePath ?? "*";
    return <MemoryRouter key={context.id} initialEntries={[route]}><PageHeaderProvider><Routes>
      <Route path={routePath} element={<div id="main-content" tabIndex={-1}><Story /></div>} />
      <Route path="*" element={<div role="status">Navigation destination</div>} />
    </Routes></PageHeaderProvider></MemoryRouter>;
  }],
};
export default preview;
