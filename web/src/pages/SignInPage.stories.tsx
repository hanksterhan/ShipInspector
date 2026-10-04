import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import SignInPage from "./SignInPage";
import { setAuthState } from "@/storybook/mocks/clerk";

const meta = {
  title: "Pages/SignIn",
  component: SignInPage,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    route: "/",
    routePath: "/",
    vendorBoundary: "Clerk SignIn",
  },
} satisfies Meta<typeof SignInPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const SignedOut: Story = {
  beforeEach: () => {
    setAuthState({ isSignedIn: false });
  },
};
export const Loading: Story = {
  beforeEach: () => {
    setAuthState({ isLoaded: false, isSignedIn: false });
  },
};
export const SignedIn: Story = {
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByRole("status"),
    ).toHaveTextContent("Navigation destination");
  },
};
