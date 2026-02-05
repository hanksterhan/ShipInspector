import { html, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import "@lit-labs/virtualizer/lit-virtualizer.js";

import { styles } from "./styles.css";
import { handLibraryStore } from "../../stores";
import type { HandListItem } from "../../services/handService";

interface FiltersDraft {
    minStakes: string;
    maxStakes: string;
    startDate: string;
    endDate: string;
    playerCount: string;
}

@customElement("hand-library")
export class HandLibrary extends MobxLitElement {
    static readonly TAG_NAME = "hand-library";
    static get styles() {
        return styles;
    }

    @state()
    private filtersOpen = false;

    @state()
    private filtersDraft: FiltersDraft = {
        minStakes: "",
        maxStakes: "",
        startDate: "",
        endDate: "",
        playerCount: "",
    };

    @state()
    private playerCountFilter: number | null = null;

    @state()
    private swipedHandId: string | null = null;

    private hasLoaded = false;
    private touchStartX = 0;
    private touchStartY = 0;
    private touchHandId: string | null = null;

    connectedCallback() {
        super.connectedCallback();
        if (!this.hasLoaded) {
            this.hasLoaded = true;
            void handLibraryStore.fetchHands();
        }
    }

    private formatDate(timestamp: number): string {
        const date = new Date(timestamp);
        if (Number.isNaN(date.getTime())) {
            return "Unknown date";
        }
        return date.toLocaleDateString();
    }

    private formatStakes(hand: HandListItem): string {
        return `${hand.small_blind}/${hand.big_blind}`;
    }

    private parseNumber(value: string): number | undefined {
        if (!value) {
            return undefined;
        }
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }

    private parseDateStart(value: string): number | undefined {
        if (!value) return undefined;
        const date = new Date(`${value}T00:00:00`);
        return Number.isNaN(date.getTime()) ? undefined : date.getTime();
    }

    private parseDateEnd(value: string): number | undefined {
        if (!value) return undefined;
        const date = new Date(`${value}T23:59:59.999`);
        return Number.isNaN(date.getTime()) ? undefined : date.getTime();
    }

    private applyFilters() {
        const minStakes = this.parseNumber(this.filtersDraft.minStakes);
        const maxStakes = this.parseNumber(this.filtersDraft.maxStakes);
        const startDate = this.parseDateStart(this.filtersDraft.startDate);
        const endDate = this.parseDateEnd(this.filtersDraft.endDate);
        const playerCount = this.parseNumber(this.filtersDraft.playerCount);

        this.playerCountFilter =
            typeof playerCount === "number" ? Math.round(playerCount) : null;

        handLibraryStore.setFilters({
            minStakes,
            maxStakes,
            startDate,
            endDate,
        });

        this.swipedHandId = null;
        this.filtersOpen = false;
    }

    private clearFilters() {
        this.filtersDraft = {
            minStakes: "",
            maxStakes: "",
            startDate: "",
            endDate: "",
            playerCount: "",
        };
        this.playerCountFilter = null;
        handLibraryStore.setFilters({});
        this.swipedHandId = null;
    }

    private get visibleHands(): HandListItem[] {
        if (this.playerCountFilter == null) {
            return handLibraryStore.hands;
        }
        return handLibraryStore.hands.filter(
            (hand) => hand.table_size === this.playerCountFilter
        );
    }

    private handleScroll(event: Event) {
        const target = event.target as HTMLElement | null;
        if (!target || handLibraryStore.isLoading) {
            return;
        }
        if (!handLibraryStore.nextCursor) {
            return;
        }
        const nearBottom =
            target.scrollTop + target.clientHeight >= target.scrollHeight - 200;
        if (nearBottom) {
            void handLibraryStore.loadMore();
        }
    }

    private handleTouchStart(handId: string, event: TouchEvent) {
        if (event.touches.length !== 1) return;
        const touch = event.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.touchHandId = handId;
    }

    private handleTouchMove(handId: string, event: TouchEvent) {
        if (this.touchHandId !== handId || event.touches.length !== 1) return;
        const touch = event.touches[0];
        const deltaX = touch.clientX - this.touchStartX;
        const deltaY = touch.clientY - this.touchStartY;

        if (Math.abs(deltaY) > 30) {
            return;
        }
        if (deltaX < -40) {
            this.swipedHandId = handId;
        }
        if (deltaX > 40) {
            this.swipedHandId = null;
        }
    }

    private handleTouchEnd(handId: string) {
        if (this.touchHandId === handId) {
            this.touchHandId = null;
        }
    }

    private handleReplay(handId: string) {
        window.location.assign(`/replay/${handId}`);
    }

    private handleDelete(handId: string) {
        void handLibraryStore.deleteHand(handId);
    }

    private updateDraftField(key: keyof FiltersDraft, value: string) {
        this.filtersDraft = { ...this.filtersDraft, [key]: value };
    }

    private renderFilterControls() {
        return html`
            <div class="filters-header">
                <div>
                    <h3>Hand Library</h3>
                    <div class="section-subtitle">
                        Browse saved hands with filters and quick actions.
                    </div>
                </div>
                <div class="filters-actions">
                    <sp-button
                        class="filters-toggle"
                        @click=${() => (this.filtersOpen = !this.filtersOpen)}
                    >
                        ${this.filtersOpen ? "Hide filters" : "Show filters"}
                    </sp-button>
                    <div class="filters-buttons">
                        <sp-button
                            variant="secondary"
                            @click=${this.clearFilters}
                        >
                            Clear
                        </sp-button>
                        <sp-button variant="cta" @click=${this.applyFilters}>
                            Apply
                        </sp-button>
                    </div>
                </div>
            </div>
            <div class="filters ${this.filtersOpen ? "open" : "collapsed"}">
                <label class="field">
                    <sp-field-label>Min Stakes</sp-field-label>
                    <sp-number-field
                        min="0"
                        .value=${this.filtersDraft.minStakes}
                        @input=${(event: Event) => {
                            const target = event.target as HTMLInputElement;
                            this.updateDraftField("minStakes", target.value);
                        }}
                    ></sp-number-field>
                </label>
                <label class="field">
                    <sp-field-label>Max Stakes</sp-field-label>
                    <sp-number-field
                        min="0"
                        .value=${this.filtersDraft.maxStakes}
                        @input=${(event: Event) => {
                            const target = event.target as HTMLInputElement;
                            this.updateDraftField("maxStakes", target.value);
                        }}
                    ></sp-number-field>
                </label>
                <label class="field">
                    <sp-field-label>Start Date</sp-field-label>
                    <input
                        class="date-input"
                        type="date"
                        .value=${this.filtersDraft.startDate}
                        @input=${(event: Event) => {
                            const target = event.target as HTMLInputElement;
                            this.updateDraftField("startDate", target.value);
                        }}
                    />
                </label>
                <label class="field">
                    <sp-field-label>End Date</sp-field-label>
                    <input
                        class="date-input"
                        type="date"
                        .value=${this.filtersDraft.endDate}
                        @input=${(event: Event) => {
                            const target = event.target as HTMLInputElement;
                            this.updateDraftField("endDate", target.value);
                        }}
                    />
                </label>
                <label class="field">
                    <sp-field-label>Player Count</sp-field-label>
                    <sp-number-field
                        min="2"
                        max="10"
                        .value=${this.filtersDraft.playerCount}
                        @input=${(event: Event) => {
                            const target = event.target as HTMLInputElement;
                            this.updateDraftField("playerCount", target.value);
                        }}
                    ></sp-number-field>
                </label>
            </div>
        `;
    }

    private renderEmptyState() {
        if (handLibraryStore.isLoading) {
            return html`<div class="list-status">Loading hands...</div>`;
        }
        if (handLibraryStore.error) {
            return html`<div class="list-status error">
                ${handLibraryStore.error}
            </div>`;
        }
        if (this.visibleHands.length === 0) {
            return html`<div class="list-status">
                No hands match the current filters.
            </div>`;
        }
        return null;
    }

    private renderHandItem = (hand: HandListItem): TemplateResult => {
        const isSwiped = this.swipedHandId === hand.id;

        return html`
            <div
                class="hand-item ${isSwiped ? "swiped" : ""}"
                @touchstart=${(event: TouchEvent) =>
                    this.handleTouchStart(hand.id, event)}
                @touchmove=${(event: TouchEvent) =>
                    this.handleTouchMove(hand.id, event)}
                @touchend=${() => this.handleTouchEnd(hand.id)}
            >
                <div class="hand-details">
                    <div>
                        <div class="label">Date</div>
                        <div class="value">
                            ${this.formatDate(hand.created_at)}
                        </div>
                    </div>
                    <div>
                        <div class="label">Stakes</div>
                        <div class="value">${this.formatStakes(hand)}</div>
                    </div>
                    <div>
                        <div class="label">Players</div>
                        <div class="value">${hand.table_size}</div>
                    </div>
                    <div>
                        <div class="label">Result</div>
                        <div class="value muted">Pending</div>
                    </div>
                </div>
                <div class="hand-actions">
                    <sp-action-button
                        class="replay-button"
                        @click=${() => this.handleReplay(hand.id)}
                    >
                        Replay
                    </sp-action-button>
                    <sp-action-button
                        class="delete-button"
                        @click=${() => this.handleDelete(hand.id)}
                    >
                        Delete
                    </sp-action-button>
                </div>
            </div>
        `;
    };

    render() {
        return html`
            <section class="hand-library">
                ${this.renderFilterControls()}
                <div class="hand-list-wrapper">
                    <lit-virtualizer
                        class="hand-list"
                        .items=${this.visibleHands}
                        .renderItem=${this.renderHandItem}
                        @scroll=${this.handleScroll}
                    ></lit-virtualizer>
                    ${this.renderEmptyState()}
                    ${handLibraryStore.isLoading && this.visibleHands.length > 0
                        ? html`<div class="list-status">Loading more...</div>`
                        : null}
                </div>
            </section>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [HandLibrary.TAG_NAME]: HandLibrary;
    }
}
