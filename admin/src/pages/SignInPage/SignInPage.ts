import { html } from "lit";
import { styles } from "./styles.css";
import { customElement, state } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { clerkService } from "../../services/clerkService";
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
        // Wait for the DOM to be ready
        await this.updateComplete;
        
        try {
            // Wait for Clerk to be initialized
            await clerkService.initialize();

            const clerk = clerkService.getClerk();

            const mountNode = this.shadowRoot?.getElementById(this.mountNodeId);

            if (!mountNode) {
                this.error = "Failed to initialize sign-in form";
                this.isLoading = false;
                return;
            }

            // Mount Clerk SignIn component with proper configuration
            // Clerk will automatically handle users who are already signed in
            clerk.mountSignIn(mountNode, {
                // Redirect after successful sign-in
                afterSignInUrl: "/invite-management",
                // Appearance customization
                appearance: {
                    elements: {
                        rootBox: "clerk-root-box",
                        card: "clerk-card"
                    }
                }
            });

            this.isLoading = false;

            // Listen for authentication state changes
            this.clerkUnsubscribe = clerk.addListener((event: any) => {
                if (event.user) {
                    // User signed in successfully - refresh auth state and verify admin role
                    // AppRoot will handle redirect
                    authStore.checkAuth().then(() => {
                        if (!authStore.isAuthenticated) {
                            this.error = "Access denied. Admin privileges required.";
                        }
                    }).catch(() => {
                        // Ignore errors - might be temporary backend issue
                    });
                }
            });
        } catch (error) {
            this.error = error instanceof Error ? error.message : "Failed to load sign-in form";
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
            }
        } catch (error) {
            // Clerk might not be initialized
        }
    }

    render() {
        return html`
            <div class="sign-in-wrapper">
                ${this.error ? html`
                    <div class="error-container">
                        <h2>Sign In Error</h2>
                        <p>${this.error}</p>
                        <button @click=${() => window.location.reload()}>Retry</button>
                    </div>
                ` : ''}
                
                ${this.isLoading && !this.error ? html`
                    <div class="loading-container">
                        <p>Loading sign-in form...</p>
                    </div>
                ` : ''}
                
                <div class="sign-in-container" style="${this.isLoading || this.error ? 'display: none;' : ''}">
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

