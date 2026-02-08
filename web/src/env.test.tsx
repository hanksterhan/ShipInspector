import { describe, it, expect } from "vitest";

describe("environment variables", () => {
  it("import.meta.env is accessible", () => {
    expect(import.meta.env).toBeDefined();
    // MODE is always set by Vite
    expect(import.meta.env.MODE).toBe("test");
  });

  it("VITE_ prefixed vars are accessible (undefined when not set)", () => {
    // Verify the env type contract works - vars are accessible even if undefined
    const apiUrl: string | undefined = import.meta.env.VITE_API_URL;
    expect(apiUrl === undefined || typeof apiUrl === "string").toBe(true);
  });
});
