import { html } from "lit";
import { styles } from "./styles.css";
import { customElement } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { clerkService } from "../../services/index";

@customElement("sign-in-page")
export class SignInPage extends MobxLitElement {
    static readonly TAG_NAME = "sign-in-page";
    static get styles() {
        return styles;
    }

    async firstUpdated() {
        await this.updateComplete;

        try {
            // Initialize Clerk
            await clerkService.initialize();
            const clerk = clerkService.getClerk();

            // Redirect to Clerk's hosted sign-in page
            // Clerk will handle the redirect back to the app after sign-in
            const returnBackUrl = window.location.origin + "/poker-hands";

            // Use Clerk's redirectToSignIn method if available
            if (clerk.redirectToSignIn) {
                clerk.redirectToSignIn({
                    redirectUrl: returnBackUrl,
                });
            } else {
                // Fallback: redirect using window.location
                // Clerk will redirect back to returnBackUrl after sign-in
                const signInUrl = clerk.buildSignInUrl
                    ? await clerk.buildSignInUrl({ redirectUrl: returnBackUrl })
                    : `${window.location.origin}/sign-in?redirect_url=${encodeURIComponent(returnBackUrl)}`;

                window.location.href = signInUrl;
            }
        } catch (error) {
            console.error("Failed to redirect to sign-in:", error);
            // Fallback: try direct redirect
            window.location.href = "/sign-in";
        }
    }

    render() {
        // Show loading state while redirecting
        return html`
            <div class="sign-in-wrapper">
                <div class="loading-container">
                    <p>Redirecting to sign-in...</p>
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
