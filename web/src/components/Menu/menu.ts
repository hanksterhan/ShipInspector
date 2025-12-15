import { html, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { styles } from "./styles.css";
import { reaction } from "mobx";
import { MobxLitElement } from "@adobe/lit-mobx";
import "@spectrum-web-components/icons-workflow/icons/sp-icon-rail-right-open.js";

import { menuStore } from "../../stores/index";
import { pokerIcon, percentageIcon } from "../../assets";
import { when } from "lit-html/directives/when.js";

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
    selectedPage: string = menuStore.selectedPage;

    constructor() {
        super();
        reaction(
            () => menuStore.selectedPage,
            (selectedPage) => {
                this.selectedPage = selectedPage;
            }
        );
    }

    navigateTo(page: string) {
        menuStore.setSelectedPage(page);
    }

    generateMenuItem(itemDetails: MenuItemDetails): TemplateResult {
        const isSelected = this.selectedPage === itemDetails.id;
        return html`
            <sp-button
                static="black"
                size="xl"
                class=${isSelected ? "selected" : ""}
                @click=${() => this.navigateTo(itemDetails.id)}
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
            <div class="header-bar${menuStore.menuVisible ? " collapsed" : ""}">
                ${MENU_ITEMS.map((menuItem: MenuItemDetails) => {
                    if (menuStore.menuVisible) {
                        return html`
                            <sp-button
                                static="black"
                                size="xl"
                                class="collapsed-menu-item${this
                                    .selectedPage === menuItem.id
                                    ? " selected"
                                    : ""}"
                                @click=${() => this.navigateTo(menuItem.id)}
                                title=${menuItem.name}
                            >
                                ${menuItem.icon}
                            </sp-button>
                        `;
                    } else {
                        return this.generateMenuItem(menuItem);
                    }
                })}
                <sp-action-button
                    class="collapse-menu-btn"
                    @click=${() => menuStore.toggleMenuVisible()}
                    label="Collapse menu"
                    quiet
                    icon-only
                >
                    ${when(
                        menuStore.menuVisible,
                        () =>
                            html`<sp-icon-rail-right-close
                                slot="icon"
                                class="menu-icon"
                            ></sp-icon-rail-right-close>`,
                        () => html`
                            <sp-icon-rail-right-open
                                slot="icon"
                                class="menu-icon"
                            ></sp-icon-rail-right-open>
                        `
                    )}
                </sp-action-button>
            </div>
        `;
    }
}
