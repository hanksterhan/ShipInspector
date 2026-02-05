import { html, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { styles } from "./styles.css";
import { reaction } from "mobx";
import { MobxLitElement } from "@adobe/lit-mobx";

import {
    menuStore,
    deckStore,
    equityStore,
    authStore,
    routerStore,
    pokerBoardStore,
    outsStore,
} from "../../stores/index";
import { boatIcon, percentageIcon, playIcon, folderIcon } from "../../assets";
import { AppPages } from "web/src/stores/MenuStore/menuStore";
import { Route } from "../../stores/RouterStore/routerStore";

interface MenuItemDetails {
    id: AppPages;
    route: Route;
    name: string;
    icon: TemplateResult;
}

const MENU_ITEMS: MenuItemDetails[] = [
    {
        id: "equity-calculator",
        route: "/equity-calculator",
        name: "Equity Calculator",
        icon: html`<span class="menu-icon">${percentageIcon}</span>`,
    },
    {
        id: "hand-replayer",
        route: "/hand-replayer",
        name: "Hand Replayer",
        icon: html`<span class="menu-icon">${playIcon}</span>`,
    },
    {
        id: "hand-library",
        route: "/hand-library",
        name: "Hand Library",
        icon: html`<span class="menu-icon">${folderIcon}</span>`,
    },
];

@customElement("app-menu")
export class Menu extends MobxLitElement {
    static readonly TAG_NAME = "app-menu";
    static get styles() {
        return styles;
    }

    @property({ type: String })
    selectedPage: AppPages = menuStore.selectedPage;

    constructor() {
        super();
        reaction(
            () => menuStore.selectedPage,
            (selectedPage) => {
                this.selectedPage = selectedPage;
            }
        );
    }

    navigateTo(page: AppPages, route: Route) {
        menuStore.setSelectedPage(page);
        // Also update router
        routerStore.navigate(route);
    }

    handleNewHand() {
        // Reset all poker board state (players, board, scope, picker, equity)
        pokerBoardStore.resetAll();
        // Clear all selected cards from deck
        deckStore.clearSelectedCards();
        // Reset equity store (legacy store, if still in use)
        equityStore.reset();
        // Reset outs calculations
        outsStore.reset();
    }

    generateMenuItem(itemDetails: MenuItemDetails): TemplateResult {
        const isSelected = this.selectedPage === itemDetails.id;
        return html`
            <sp-button
                static="black"
                size="xl"
                class=${isSelected ? "selected" : ""}
                @click=${() =>
                    this.navigateTo(itemDetails.id, itemDetails.route)}
            >
                <div class="menu-item-container">
                    ${itemDetails.icon}
                    <h2>${itemDetails.name}</h2>
                </div>
            </sp-button>
        `;
    }

    render() {
        return html`
            <div class="header-bar">
                <div class="app-logo">
                    <span class="logo-icon">${boatIcon}</span>
                    <h1>Ship Inspector</h1>
                </div>
                <div class="menu-items">
                    ${MENU_ITEMS.map((menuItem: MenuItemDetails) => {
                        return this.generateMenuItem(menuItem);
                    })}
                </div>
                <div class="action-buttons">
                    <sp-action-button
                        class="new-hand-button"
                        size="s"
                        @click=${this.handleNewHand}
                    >
                        New hand
                    </sp-action-button>
                    ${authStore.isAuthenticated
                        ? html`<sp-action-button
                              class="logout-button"
                              size="s"
                              @click=${async () => {
                                  await authStore.logout();
                              }}
                          >
                              Logout
                          </sp-action-button>`
                        : null}
                </div>
            </div>
        `;
    }
}
