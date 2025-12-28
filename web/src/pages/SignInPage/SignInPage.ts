import { html } from "lit";
import { styles } from "./styles.css";
import { customElement, state } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { clerkService } from "../../services/index";
import { authStore, routerStore } from "../../stores/index";

@customElement("sign-in-page")
export class SignInPage extends MobxLitElement {
    static readonly TAG_NAME = "sign-in-page";
    static get styles() {
        return styles;
    }

    @state()
    private mountNodeId = "clerk-sign-in";

    @state()
    private errorMessage = "";

    @state()
    private isLoading = true;

    async firstUpdated() {
        console.log("SignInPage mounted, initializing Clerk...");
        
        try {
            // Wait for Clerk to be initialized
            await clerkService.initialize();
            console.log("Clerk initialized successfully");

            const clerk = clerkService.getClerk();
            console.log("Got Clerk instance:", clerk);

            const mountNode = this.shadowRoot?.getElementById(this.mountNodeId);

            if (!mountNode) {
                console.error("Mount node not found");
                this.errorMessage = "Failed to find mount node";
                this.isLoading = false;
                return;
            }

            console.log("Mounting Clerk SignIn to:", mountNode);

            // Mount Clerk SignIn component
            clerk.mountSignIn(mountNode, {
                afterSignInUrl: "/poker-hands",
                appearance: {
                    elements: {
                        rootBox: "clerk-root-box",
                        card: "clerk-card",
                    },
                },
            });

            this.isLoading = false;
            console.log("Clerk SignIn mounted successfully");

            // Listen for sign-in success
            clerk.addListener((event: any) => {
                console.log("Clerk event:", event);
                if (event.user && !authStore.isAuthenticated) {
                    // User signed in, refresh auth state
                    authStore.checkAuth().then(() => {
                        routerStore.navigate("/poker-hands");
                    });
                }
            });
        } catch (error) {
            console.error("Failed to mount Clerk SignIn:", error);
            this.errorMessage = error instanceof Error ? error.message : "Failed to initialize authentication";
            this.isLoading = false;
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        try {
            const clerk = clerkService.getClerk();
            const mountNode = this.shadowRoot?.getElementById(this.mountNodeId);
            if (mountNode) {
                clerk.unmountSignIn(mountNode);
            }
        } catch (error) {
            // Clerk might not be initialized
            console.debug("Cleanup error:", error);
        }
    }

    render() {
        return html`
            <sp-theme system="spectrum" color="light" scale="medium" dir="ltr">
                <div class="signin-container">
                    <div class="signin-card">
                        <h1 class="signin-title">Ship Inspector</h1>
                        ${this.errorMessage
                            ? html`
                                <div class="error-message">
                                    <strong>Error:</strong> ${this.errorMessage}
                                    <br /><br />
                                    <small>Make sure you have set VITE_CLERK_PUBLISHABLE_KEY in your .env file</small>
                                </div>
                            `
                            : null}
                        ${this.isLoading
                            ? html`
                                <div class="loading-message">
                                    <sp-progress-circle indeterminate size="l"></sp-progress-circle>
                                    <p>Loading authentication...</p>
                                </div>
                            `
                            : null}
                        <div id="${this.mountNodeId}" class="clerk-mount-point"></div>
                    </div>
                </div>
            </sp-theme>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [SignInPage.TAG_NAME]: SignInPage;
    }
}

