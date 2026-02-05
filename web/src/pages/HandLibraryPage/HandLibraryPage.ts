import { html } from "lit";
import { styles } from "./styles.css";
import { customElement } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";

import "../index";
import "../../components/index";

/**
 * HandLibraryPage - View and manage saved poker hands
 *
 * This page displays a library of all recorded poker hands,
 * allowing users to browse, search, and select hands for replay.
 */
@customElement("hand-library-page")
export class HandLibraryPage extends MobxLitElement {
    static readonly TAG_NAME = "hand-library-page";
    static get styles() {
        return styles;
    }

    render() {
        return html`
            <div class="page-wrapper">
                <div class="page-container">
                    <div class="page-header">
                        <h1>Hand Library</h1>
                        <p>Browse and manage your saved poker hands.</p>
                    </div>
                    <div class="page-content">
                        <hand-library></hand-library>
                    </div>
                </div>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [HandLibraryPage.TAG_NAME]: HandLibraryPage;
    }
}
