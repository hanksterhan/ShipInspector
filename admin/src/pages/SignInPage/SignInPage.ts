import { html } from "lit";
import { styles } from "./styles.css";
import { customElement, state } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { clerkService } from "../../services/clerkService";
import { authStore, routerStore } from "../../stores/index";

@customElement("sign-in-page")
export class SignInPage extends MobxLitElement {
    static readonly TAG_NAME = "sign-in-page";
    static get styles() {
        return styles;
    }

    @state()
    private mountNodeId = "clerk-sign-in";

    async firstUpdated() {
        try {
            const clerk = clerkService.getClerk();
            const mountNode = this.shadowRoot?.getElementById(this.mountNodeId);

            if (!mountNode) {
                console.error("Mount node not found");
                return;
            }

            // Mount Clerk SignIn component
            clerk.mountSignIn(mountNode, {
                afterSignInUrl: "/invite-management",
                appearance: {
                    elements: {
                        rootBox: "clerk-root-box",
                        card: "clerk-card",
                    },
                },
            });

            // Listen for sign-in success
            clerk.addListener((event: any) => {
                if (event.user && !authStore.isAuthenticated) {
                    // User signed in, refresh auth state and verify admin role
                    authStore.checkAuth().then(() => {
                        if (authStore.isAuthenticated) {
                            routerStore.navigate("/invite-management");
                        }
                    });
                }
            });
        } catch (error) {
            console.error("Failed to mount Clerk SignIn:", error);
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        try {
            const clerk = clerkService.getClerk();
            clerk.unmountSignIn(this.shadowRoot?.getElementById(this.mountNodeId)!);
        } catch (error) {
            // Clerk might not be initialized
        }
    }

    render() {
        return html`
            <sp-theme system="spectrum" color="light" scale="medium" dir="ltr">
                <div class="signin-container">
                    <div class="signin-card">
                        <h1 class="signin-title">Ship Inspector Admin</h1>
                        <p class="signin-subtitle">Admin Access Required</p>
                        ${authStore.error
                            ? html`<div class="error-message">
                                  ${authStore.error}
                              </div>`
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

