import { html } from "lit";
import { styles } from "./styles.css";
import { customElement } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { handBuilderStore, Street } from "../../../stores/index";

/**
 * ActionTimeline component - Displays a timeline of actions with street tags
 * Only rendered once the hand starts
 */
@customElement("action-timeline")
export class ActionTimeline extends MobxLitElement {
    static readonly TAG_NAME = "action-timeline";
    static get styles() {
        return styles;
    }

    private formatActionText(action: {
        type: string;
        actor_seat?: number;
        amount?: number;
        raise_to?: number;
    }): string {
        const player = action.actor_seat
            ? handBuilderStore.players.get(action.actor_seat)
            : null;
        const playerName = player
            ? player.player_label
            : action.actor_seat
              ? `Seat ${action.actor_seat}`
              : "Unknown";

        switch (action.type) {
            case "POST_SB":
                return `${playerName} posts small blind`;
            case "POST_BB":
                return `${playerName} posts big blind`;
            case "POST_ANTE":
                return `${playerName} posts ante`;
            case "STRADDLE":
                return `${playerName} straddles`;
            case "FOLD":
                return `${playerName} folds`;
            case "CHECK":
                return `${playerName} checks`;
            case "CALL":
                return `${playerName} calls ${action.amount ?? ""}`;
            case "BET":
                return `${playerName} bets ${action.amount ?? ""}`;
            case "RAISE":
                if (action.raise_to) {
                    return `${playerName} raises to ${action.raise_to}`;
                } else if (action.amount) {
                    return `${playerName} raises ${action.amount}`;
                } else {
                    return `${playerName} raises`;
                }
            case "ALL_IN":
                return `${playerName} goes all-in`;
            case "REVEAL":
                return `${playerName} reveals`;
            case "DEAL_FLOP":
                return "Deal flop";
            case "DEAL_TURN":
                return "Deal turn";
            case "DEAL_RIVER":
                return "Deal river";
            case "COLLECT":
                return `${playerName} collects pot`;
            case "NOTE":
                return `${playerName} note`;
            default:
                return `${playerName}: ${action.type}`;
        }
    }

    private getStreetTag(street: Street): string {
        switch (street) {
            case "PREFLOP":
                return "PF";
            case "FLOP":
                return "F";
            case "TURN":
                return "T";
            case "RIVER":
                return "R";
            case "SHOWDOWN":
                return "SD";
        }
    }

    render() {
        const { actionDrafts, GetHandStarted } = handBuilderStore;

        // Only render if hand has started
        if (!GetHandStarted || actionDrafts.length === 0) {
            return html``;
        }

        return html`
            <div class="action-timeline-container">
                ${actionDrafts.map(
                    (action) => html`
                        <div class="action-timeline-item">
                            <div class="action-text">
                                ${this.formatActionText(action)}
                            </div>
                            <div
                                class="street-tag street-tag-${this.getStreetTag(
                                    action.street
                                )}"
                            >
                                ${this.getStreetTag(action.street)}
                            </div>
                        </div>
                    `
                )}
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [ActionTimeline.TAG_NAME]: ActionTimeline;
    }
}
