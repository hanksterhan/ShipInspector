import { html } from "lit";
import { styles } from "./styles.css";
import { customElement, property } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";

import "../index";
import "../../components/index";

import { menuStore, authStore, routerStore } from "../../stores/index";

@customElement("app-root")
export class AppRoot extends MobxLitElement {
    static readonly TAG_NAME = "app-root";
    static get styles() {
        return styles;
    }

    @property({ type: String })
    selectedPage: string = menuStore.selectedPage;

    render() {
        // Access observables directly to ensure MobX tracks them
        const isLoading = authStore.isLoading;
        const isAuthenticated = authStore.isAuthenticated;
        const currentRoute = routerStore.currentRoute;

        // Show loading state while checking authentication
        if (isLoading) {
            return html`
                <sp-theme
                    system="spectrum"
                    color="light"
                    scale="medium"
                    dir="ltr"
                >
                    <div class="loading-container">
                        <sp-progress-circle indeterminate></sp-progress-circle>
                    </div>
                </sp-theme>
            `;
        }

        // Route guard: redirect to login if trying to access protected route without auth
        if (!isAuthenticated && routerStore.isAuthenticatedRoute) {
            routerStore.navigate("/");
            return html`
                <sp-theme
                    system="spectrum"
                    color="light"
                    scale="medium"
                    dir="ltr"
                >
                    <div class="loading-container">
                        <sp-progress-circle indeterminate></sp-progress-circle>
                    </div>
                </sp-theme>
            `;
        }

        // Show login page for root/login route if not authenticated
        if (
            !isAuthenticated &&
            (currentRoute === "/" || currentRoute === "/login")
        ) {
            return html`<login-page></login-page>`;
        }

        // Redirect authenticated users from login to main app
        if (
            isAuthenticated &&
            (currentRoute === "/" || currentRoute === "/login")
        ) {
            routerStore.navigate("/invite-management");
            return html`
                <sp-theme
                    system="spectrum"
                    color="light"
                    scale="medium"
                    dir="ltr"
                >
                    <div class="loading-container">
                        <sp-progress-circle indeterminate></sp-progress-circle>
                    </div>
                </sp-theme>
            `;
        }

        // Show main app for authenticated routes
        return html`
            <sp-theme system="spectrum" color="light" scale="medium" dir="ltr">
                <div class="app-root-flex-container">
                    <app-menu></app-menu>
                    <div class="app-root-content">
                        ${(() => {
                            // Use router for navigation, but sync with menuStore for menu highlighting
                            const route = routerStore.currentRoute;

                            // Update menuStore to match route
                            if (
                                route === "/invite-management" &&
                                menuStore.selectedPage !== "invite-management"
                            ) {
                                menuStore.setSelectedPage("invite-management");
                            }

                            switch (route) {
                                case "/invite-management":
                                    return html`<invite-management></invite-management>`;
                                default:
                                    return html`<login-page></login-page>`;
                            }
                        })()}
                    </div>
                </div>
            </sp-theme>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [AppRoot.TAG_NAME]: AppRoot;
    }
}
