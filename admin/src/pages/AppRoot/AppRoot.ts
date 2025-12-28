import { html } from "lit";
import { styles } from "./styles.css";
import { customElement, property } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";

import "../index";
import "../../components/index";

// Explicitly import SignInPage component to ensure it's registered
import "../SignInPage/SignInPage";
import { SignInPage } from "../SignInPage/SignInPage";

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

        // Route guard: redirect to login if trying to access protected route without auth or not admin
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

        // Additional guard: if authenticated but not admin, redirect to login
        if (authStore.user && authStore.user.role !== "admin") {
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

        // Show sign-in page for root/signin route if not authenticated
        if (
            !isAuthenticated &&
            (currentRoute === "/" || currentRoute === "/signin")
        ) {
            // Force component registration by referencing the class
            if (!customElements.get("sign-in-page")) {
                customElements.define("sign-in-page", SignInPage);
            }
            return html`<sign-in-page></sign-in-page>`;
        }

        // Redirect authenticated users from signin to main app
        if (
            isAuthenticated &&
            (currentRoute === "/" || currentRoute === "/signin")
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
                            } else if (
                                route === "/swagger-docs" &&
                                menuStore.selectedPage !== "swagger-docs"
                            ) {
                                menuStore.setSelectedPage("swagger-docs");
                            }

                            switch (route) {
                                case "/invite-management":
                                    return html`<invite-management></invite-management>`;
                                case "/swagger-docs":
                                    return html`<swagger-docs></swagger-docs>`;
                                default:
                                    return html`<invite-management></invite-management>`;
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
