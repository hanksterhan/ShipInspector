import { html, TemplateResult } from "lit";
import { styles } from "./styles.css";
import { customElement } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { Card } from "@common/interfaces";
import { cardStore, settingsStore } from "../../stores/index";
import { SUITS, RANKS } from "../utilities";
import "../HoleSelector";
import "../BoardSelector";
import "../EquityDisplay";
import "../OutsDisplay";

@customElement("poker-hand")
export class PokerHand extends MobxLitElement {
    static readonly TAG_NAME = "poker-hand";
    static get styles() {
        return styles;
    }

    renderCard(card: Card | null, index: number): TemplateResult {
        if (!card) {
            return html`
                <div class="hole-card-placeholder">
                    <span class="card-number">Card ${index + 1}</span>
                </div>
            `;
        }

        const suitData = SUITS.find((s) => s.suit === card.suit);
        const rankData = RANKS.find((r) => r.rank === card.rank);

        return html`
            <div class="hole-card">
                <div class="hole-card-content">
                    <span class="hole-card-rank">${rankData?.label}</span>
                    <span
                        class="hole-card-suit-icon"
                        style="color: ${suitData?.color || "#000"}"
                    >
                        ${suitData?.icon}
                    </span>
                </div>
            </div>
        `;
    }

    renderSelectedHoles(): TemplateResult {
        const holesWithIndices = cardStore.holeCards
            .map((hole, index) => ({ hole, playerIndex: index }))
            .filter((item) => item.hole !== undefined);

        if (holesWithIndices.length === 0) {
            return html``;
        }

        return html`
            <div class="selected-holes-section">
                <div class="selected-holes-grid">
                    ${holesWithIndices.map(
                        ({ hole, playerIndex }) => html`
                            <div class="player-hole-container">
                                <div class="player-label">
                                    Player ${playerIndex + 1}
                                </div>
                                <div class="player-hole-cards">
                                    ${this.renderCard(hole.cards[0], 0)}
                                    ${this.renderCard(hole.cards[1], 1)}
                                </div>
                                <equity-display
                                    .playerIndex=${playerIndex}
                                ></equity-display>
                            </div>
                        `
                    )}
                </div>
            </div>
        `;
    }

    renderOutsSection(): TemplateResult {
        // Show outs display only for player 0 (hero) when we have exactly 2 players and 4 board cards (turn)
        const shouldShowOuts =
            cardStore.holeCards.filter((h) => h !== undefined).length === 2 &&
            cardStore.boardCards.length === 4;

        if (!shouldShowOuts) {
            return html``;
        }

        return html`
            <div class="outs-section">
                <outs-display .playerIndex=${0}></outs-display>
            </div>
        `;
    }

    render() {
        const selectedHolesCount = cardStore.holeCards.filter(
            (hole) => hole !== undefined
        ).length;
        const allHolesSelected = selectedHolesCount === settingsStore.players;
        const hasSelectedHoles = selectedHolesCount > 0;

        return html`
            ${hasSelectedHoles ? this.renderSelectedHoles() : html``}
            ${hasSelectedHoles ? this.renderOutsSection() : html``}
            ${allHolesSelected
                ? html` <board-selector></board-selector> `
                : html` <hole-selector></hole-selector> `}
        `;
    }
}
