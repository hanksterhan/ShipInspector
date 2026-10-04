import type { Meta, StoryObj } from "@storybook/react-vite";
import LoadingSpinner from "./LoadingSpinner";

const meta = { title: "Shell/LoadingSpinner", component: LoadingSpinner, tags: ["autodocs"] } satisfies Meta<typeof LoadingSpinner>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
