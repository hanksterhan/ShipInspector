import { html } from "lit";
import { styles } from "./styles.css";
import { customElement, property } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";

import "../index";
import "../../components/index";

// Explicitly import SignInPage component to ensure it's registered
import "../SignInPage/SignInPage";
import { SignInPage } from "../SignInPage/SignInPage";

import {
    menuStore,
    settingsStore,
    authStore,
    routerStore,
} from "../../stores/index";
import { gearIcon } from "../../assets/index";

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
            routerStore.navigate("/poker-hands");
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
                                route === "/poker-hands" &&
                                menuStore.selectedPage !== "poker-hands"
                            ) {
                                menuStore.setSelectedPage("poker-hands");
                            } else if (
                                route === "/equity-calculator" &&
                                menuStore.selectedPage !== "equity-calculator"
                            ) {
                                menuStore.setSelectedPage("equity-calculator");
                            }

                            switch (route) {
                                case "/poker-hands":
                                    return html`<poker-hands></poker-hands>`;
                                case "/equity-calculator":
                                    return html`<equity-calculator></equity-calculator>`;
                                default:
                                    return html`<poker-hands></poker-hands>`;
                            }
                        })()}
                    </div>
                    ${settingsStore.trayOpen
                        ? html`<div class="settings-card">
                              <poker-options></poker-options>
                          </div>`
                        : null}
                    ${!settingsStore.trayOpen
                        ? html`<sp-action-button
                              class="settings-toggle-button"
                              @click=${() => settingsStore.toggleTray()}
                              quiet
                              title="Settings"
                          >
                              <span slot="icon" class="settings-icon"
                                  >${gearIcon}</span
                              >
                          </sp-action-button>`
                        : null}
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
