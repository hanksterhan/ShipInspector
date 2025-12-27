import { html } from "lit";
import { styles } from "./styles.css";
import { customElement, property } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";

import "../index";
import "../../components/index";

import {
    menuStore,
    settingsStore,
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
        const currentRoute = routerStore.currentRoute;

        // Auth disabled - redirect root/login to main app
        if (currentRoute === "/" || currentRoute === "/login") {
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
