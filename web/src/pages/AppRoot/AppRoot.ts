import { html } from "lit";
import { styles } from "./styles.css";
import { customElement, property } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { reaction } from "mobx";

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
    pokerBoardStore,
    deckStore,
    equityStore,
    outsStore,
} from "../../stores/index";
import { gearIcon, refreshIcon } from "../../assets/index";
import { Route } from "../../stores/RouterStore/routerStore";

@customElement("app-root")
export class AppRoot extends MobxLitElement {
    static readonly TAG_NAME = "app-root";
    static get styles() {
        return styles;
    }

    @property({ type: String })
    selectedPage: string = menuStore.selectedPage;

    private previousRoute: Route | null = null;
    private routeReactionDisposer: (() => void) | null = null;

    constructor() {
        super();
        // Initialize previousRoute to current route
        this.previousRoute = routerStore.currentRoute;
        // Track route changes and reset hand stores when switching between poker routes
        this.routeReactionDisposer = reaction(
            () => routerStore.currentRoute,
            (currentRoute) => {
                const prevRoute = this.previousRoute;
                this.previousRoute = currentRoute;

                // Reset hand stores when switching between "/poker-hands" and "/odds-calculator"
                const pokerRoutes: Route[] = [
                    "/poker-hands",
                    "/odds-calculator",
                ];
                if (
                    prevRoute &&
                    pokerRoutes.includes(prevRoute) &&
                    pokerRoutes.includes(currentRoute) &&
                    prevRoute !== currentRoute
                ) {
                    this.resetHandStores();
                }
            }
        );
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.routeReactionDisposer) {
            this.routeReactionDisposer();
            this.routeReactionDisposer = null;
        }
    }

    /**
     * Reset all stores related to the hand (excluding settingsStore)
     */
    private resetHandStores() {
        // Reset all poker board state (players, board, scope, picker, equity)
        pokerBoardStore.resetAll();
        // Clear all selected cards from deck
        deckStore.clearSelectedCards();
        // Reset equity store (legacy store, if still in use)
        equityStore.reset();
        // Reset outs calculations
        outsStore.reset();
    }

    handleNewHand() {
        this.resetHandStores();
    }

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
                        <sp-progress-circle
                            indeterminate
                            aria-label="Loading"
                        ></sp-progress-circle>
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
                        <sp-progress-circle
                            indeterminate
                            aria-label="Loading"
                        ></sp-progress-circle>
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
                        <sp-progress-circle
                            indeterminate
                            aria-label="Loading"
                        ></sp-progress-circle>
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
                                route === "/odds-calculator" &&
                                menuStore.selectedPage !== "odds-calculator"
                            ) {
                                menuStore.setSelectedPage("odds-calculator");
                            }

                            switch (route) {
                                case "/poker-hands":
                                    return html`<poker-hands></poker-hands>`;
                                case "/odds-calculator":
                                    return html`<odds-calculator></odds-calculator>`;
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
                        ? html`
                              <sp-action-button
                                  class="refresh-button"
                                  @click=${this.handleNewHand}
                                  quiet
                                  title="New hand"
                              >
                                  <span slot="icon" class="refresh-icon"
                                      >${refreshIcon}</span
                                  >
                              </sp-action-button>
                              <sp-action-button
                                  class="settings-toggle-button"
                                  @click=${() => settingsStore.toggleTray()}
                                  quiet
                                  title="Settings"
                              >
                                  <span slot="icon" class="settings-icon"
                                      >${gearIcon}</span
                                  >
                              </sp-action-button>
                          `
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
