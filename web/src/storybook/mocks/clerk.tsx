import { useSyncExternalStore } from "react";

type AuthState = { isLoaded: boolean; isSignedIn: boolean };
let state: AuthState = { isLoaded: true, isSignedIn: true };
const listeners = new Set<() => void>();
export function setAuthState(next: Partial<AuthState> = {}) {
  state = { isLoaded: true, isSignedIn: true, ...next };
  listeners.forEach((listener) => listener());
}
function useStateSnapshot() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
  );
}
export function useAuth() {
  return {
    ...useStateSnapshot(),
    userId: state.isSignedIn ? "storybook-user" : null,
    getToken: async () => "storybook-token",
  };
}
export function useUser() {
  const auth = useStateSnapshot();
  return {
    ...auth,
    user: auth.isSignedIn
      ? {
          id: "storybook-user",
          firstName: "Alex",
          fullName: "Alex Morgan",
          username: "Alex",
          primaryEmailAddress: { emailAddress: "alex@example.test" },
        }
      : null,
  };
}
export function useClerk() {
  return { signOut: async () => setAuthState({ isSignedIn: false }) };
}
export function SignIn() {
  return (
    <div
      className="rounded-lg border bg-card p-6"
      role="group"
      aria-label="Clerk sign-in test boundary"
    >
      Clerk sign-in{" "}
      <span className="text-muted-foreground">(vendor test boundary)</span>
    </div>
  );
}
