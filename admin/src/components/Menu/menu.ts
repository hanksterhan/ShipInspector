import { html, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { styles } from "./styles.css";
import { reaction } from "mobx";
import { MobxLitElement } from "@adobe/lit-mobx";

import { menuStore, authStore, routerStore } from "../../stores/index";
import { AppPages } from "../../stores/MenuStore/menuStore";
import { compassIcon } from "../../assets";

interface MenuItemDetails {
    id: string;
    name: string;
    icon: TemplateResult;
}

const MENU_ITEMS: MenuItemDetails[] = [
    {
        id: "invite-management",
        name: "Invite Management",
        icon: html`<span class="menu-icon">${compassIcon}</span>`,
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
                <div class="menu-items">
                    ${MENU_ITEMS.map((menuItem: MenuItemDetails) => {
                        return this.generateMenuItem(menuItem);
                    })}
                </div>
                <div class="action-buttons">
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
