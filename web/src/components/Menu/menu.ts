import { html, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { styles } from "./styles.css";
import { reaction } from "mobx";
import { MobxLitElement } from "@adobe/lit-mobx";

import {
    menuStore,
    cardStore,
    deckStore,
    equityStore,
    settingsStore,
    routerStore,
} from "../../stores/index";
import { pokerIcon, percentageIcon, boatIcon } from "../../assets";
import { AppPages } from "web/src/stores/MenuStore/menuStore";

interface MenuItemDetails {
    id: string;
    name: string;
    icon: TemplateResult;
}

const MENU_ITEMS: MenuItemDetails[] = [
    {
        id: "poker-hands",
        name: "Poker Hands",
        icon: html`<span class="menu-icon">${pokerIcon}</span>`,
    },
    {
        id: "equity-calculator",
        name: "Equity Calculator",
        icon: html`<span class="menu-icon">${percentageIcon}</span>`,
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

    navigateTo(page: AppPages) {
        menuStore.setSelectedPage(page);
        // Also update router
        routerStore.navigate(`/${page}`);
    }

    handleNewHand() {
        // Clear all selected cards
        deckStore.clearSelectedCards();
        // Reset all hole cards and board cards
        cardStore.resetHoleSelection();
        cardStore.setBoardCards([]);
        cardStore.resetBoardSelection();
        // Reset equity calculations
        equityStore.reset();
    }

    handleNewBoard() {
        // Reset only board cards
        cardStore.boardCards.forEach((card) => {
            deckStore.markCardAsUnselected(card);
        });
        cardStore.setBoardCards([]);
        cardStore.resetBoardSelection();
    }

    get isBoardSelectorVisible(): boolean {
        // Board selector is visible when:
        // 1. We're on the poker-hands page
        // 2. All holes are selected
        const selectedHolesCount = cardStore.holeCards.filter(
            (hole) => hole !== undefined
        ).length;
        const allHolesSelected = selectedHolesCount === settingsStore.players;
        return menuStore.selectedPage === "poker-hands" && allHolesSelected;
    }

    generateMenuItem(itemDetails: MenuItemDetails): TemplateResult {
        const isSelected = this.selectedPage === itemDetails.id;
        return html`
            <sp-button
                static="black"
                size="xl"
                class=${isSelected ? "selected" : ""}
                @click=${() => this.navigateTo(itemDetails.id as AppPages)}
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
                        class="new-board-button"
                        size="s"
                        ?disabled=${!this.isBoardSelectorVisible}
                        @click=${this.handleNewBoard}
                    >
                        New board
                    </sp-action-button>
                    <sp-action-button
                        class="new-hand-button"
                        size="s"
                        @click=${this.handleNewHand}
                    >
                        New hand
                    </sp-action-button>
                    <!-- Logout button removed - auth disabled -->
                </div>
            </div>
        `;
    }
}
