import { html } from "lit";
import { styles } from "./styles.css";
import { customElement } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";

import "../index";
import "../../components/index";

/**
 * HandReplayerPage - Replay recorded poker hands
 *
 * This page provides an interface for replaying previously recorded
 * poker hands, allowing users to step through actions and analyze play.
 */
@customElement("hand-replayer-page")
export class HandReplayerPage extends MobxLitElement {
    static readonly TAG_NAME = "hand-replayer-page";
    static get styles() {
        return styles;
    }

    render() {
        return html`
            <div class="page-wrapper">
                <div class="page-container">
                    <div class="page-header">
                        <h1>Hand Replayer</h1>
                        <p>Replay and analyze your recorded poker hands.</p>
                    </div>
                    <div class="page-content">
                        <div class="placeholder-content">
                            <p>
                                Select a hand from your library to replay it
                                here.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [HandReplayerPage.TAG_NAME]: HandReplayerPage;
    }
}
