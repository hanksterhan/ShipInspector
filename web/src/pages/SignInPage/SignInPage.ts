import { html } from "lit";
import { styles } from "./styles.css";
import { customElement, state } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { clerkService } from "../../services/index";
import { authStore } from "../../stores/index";

@customElement("sign-in-page")
export class SignInPage extends MobxLitElement {
    static readonly TAG_NAME = "sign-in-page";
    static get styles() {
        return styles;
    }

    @state()
    private mountNodeId = "clerk-sign-in";

    @state()
    private error: string | null = null;

    @state()
    private isLoading = true;

    private clerkUnsubscribe?: (() => void) | null = null;

    async firstUpdated() {
        console.log("SignInPage mounted, initializing Clerk...");

        // Wait for the DOM to be ready
        await this.updateComplete;

        try {
            // Wait for Clerk to be initialized
            await clerkService.initialize();
            console.log("Clerk initialized successfully");

            const clerk = clerkService.getClerk();

            const mountNode = this.shadowRoot?.getElementById(this.mountNodeId);

            if (!mountNode) {
                console.error("Mount node not found in shadow DOM");
                console.error("Shadow root:", this.shadowRoot);
                console.error(
                    "Available elements:",
                    this.shadowRoot?.querySelectorAll("*")
                );
                this.error = "Failed to initialize sign-in form";
                this.isLoading = false;
                return;
            }

            console.log("Mounting Clerk SignIn component to:", mountNode);

            // Mount Clerk SignIn component with proper configuration
            // Clerk will automatically handle users who are already signed in
            clerk.mountSignIn(mountNode, {
                // Redirect after successful sign-in
                afterSignInUrl: "/poker-hands",
                // Redirect to sign-up page if user doesn't have an account
                signUpUrl: "/sign-up",
                // Appearance customization
                appearance: {
                    elements: {
                        rootBox: "clerk-root-box",
                        card: "clerk-card",
                    },
                },
            });

            console.log("Clerk SignIn mounted successfully");
            this.isLoading = false;

            // Listen for authentication state changes
            this.clerkUnsubscribe = clerk.addListener((event: any) => {
                console.log("Clerk event:", event);

                if (event.user) {
                    // User signed in successfully
                    console.log("User signed in:", event.user);

                    // Refresh auth state - AppRoot will handle redirect
                    // Only call checkAuth when user actually signs in (not on initial mount)
                    authStore
                        .checkAuth()
                        .then(() => {
                            console.log(
                                "Auth state updated, AppRoot will handle redirect"
                            );
                        })
                        .catch((err) => {
                            console.error("Failed to verify auth:", err);
                            // Don't set error here as it might be a temporary backend issue
                            // The user is signed in with Clerk, so show a warning but allow them to proceed
                            console.warn(
                                "Backend verification failed, but Clerk auth is valid"
                            );
                        });
                }
            });
        } catch (error) {
            console.error("Failed to mount Clerk SignIn:", error);
            this.error =
                error instanceof Error
                    ? error.message
                    : "Failed to load sign-in form";
            this.isLoading = false;
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();

        // Unsubscribe from Clerk events
        if (this.clerkUnsubscribe) {
            this.clerkUnsubscribe();
            this.clerkUnsubscribe = null;
        }

        // Unmount Clerk component
        try {
            const clerk = clerkService.getClerk();
            const mountNode = this.shadowRoot?.getElementById(this.mountNodeId);
            if (mountNode) {
                clerk.unmountSignIn(mountNode);
                console.log("Clerk SignIn unmounted");
            }
        } catch (error) {
            // Clerk might not be initialized
            console.debug("Cleanup error:", error);
        }
    }

    render() {
        return html`
            <div class="sign-in-wrapper">
                ${this.error
                    ? html`
                          <div class="error-container">
                              <h2>Sign In Error</h2>
                              <p>${this.error}</p>
                              <button @click=${() => window.location.reload()}>
                                  Retry
                              </button>
                          </div>
                      `
                    : ""}
                ${this.isLoading && !this.error
                    ? html`
                          <div class="loading-container">
                              <p>Loading sign-in form...</p>
                          </div>
                      `
                    : ""}

                <div
                    class="sign-in-container"
                    style="${this.isLoading || this.error
                        ? "display: none;"
                        : ""}"
                >
                    <div id="${this.mountNodeId}"></div>
                </div>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [SignInPage.TAG_NAME]: SignInPage;
    }
}
