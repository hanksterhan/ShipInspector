import { html } from "lit";
import { styles } from "./styles.css";
import { customElement, property } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { pokerBoardStore } from "../../stores/index";

/**
 * PlayerNameEditModal component - Modal dialog for editing player names
 */
@customElement("player-name-edit-modal")
export class PlayerNameEditModal extends MobxLitElement {
    static readonly TAG_NAME = "player-name-edit-modal";
    static get styles() {
        return styles;
    }

    @property({ type: Boolean })
    isOpen: boolean = false;

    @property({ type: Number })
    playerIndex: number | null = null;

    private inputValue: string = "";
    private lastPlayerIndex: number | null = null;

    updated(changedProperties: Map<string | number | symbol, unknown>) {
        super.updated(changedProperties);

        // Reset input value when modal opens or player index changes
        const isOpen =
            this.isOpen !== undefined
                ? this.isOpen
                : pokerBoardStore.playerNameEditOpen;
        const playerIndex =
            this.playerIndex !== null
                ? this.playerIndex
                : pokerBoardStore.playerNameEditIndex;

        if (isOpen && playerIndex !== null) {
            // If player index changed or modal just opened, reset input value
            if (this.lastPlayerIndex !== playerIndex) {
                // Get custom name if exists, otherwise use empty string
                const customName = pokerBoardStore.playerNames.get(playerIndex);
                this.inputValue = customName || "";
                this.lastPlayerIndex = playerIndex;
                // Request update to ensure textfield gets the new value
                this.requestUpdate();
            }
        } else if (!isOpen) {
            // Reset when modal closes
            this.lastPlayerIndex = null;
            this.inputValue = "";
        }
    }

    handleOverlayClick(e: Event) {
        if (e.target === e.currentTarget) {
            pokerBoardStore.closePlayerNameEdit();
        }
    }

    handleClose() {
        pokerBoardStore.closePlayerNameEdit();
    }

    handleInputChange(e: Event) {
        const target = e.target as any;
        // sp-textfield exposes value property
        this.inputValue = target.value || "";
    }

    handleSave() {
        const playerIndex =
            this.playerIndex !== null
                ? this.playerIndex
                : pokerBoardStore.playerNameEditIndex;

        if (playerIndex !== null) {
            const trimmedValue = this.inputValue.trim();
            pokerBoardStore.setPlayerName(
                playerIndex,
                trimmedValue === "" ? null : trimmedValue
            );
        }
        pokerBoardStore.closePlayerNameEdit();
    }

    handleKeyDown(e: KeyboardEvent) {
        if (e.key === "Enter") {
            e.preventDefault();
            this.handleSave();
        } else if (e.key === "Escape") {
            e.preventDefault();
            this.handleClose();
        }
    }

    render() {
        // Use the property if provided, otherwise use the store directly
        const isOpen =
            this.isOpen !== undefined
                ? this.isOpen
                : pokerBoardStore.playerNameEditOpen;
        const playerIndex =
            this.playerIndex !== null
                ? this.playerIndex
                : pokerBoardStore.playerNameEditIndex;

        if (!isOpen || playerIndex === null) {
            return null;
        }

        return html`
            <div
                class="name-edit-modal-overlay"
                @click=${this.handleOverlayClick}
            >
                <div class="name-edit-modal-content">
                    <div class="name-edit-modal-header">
                        <h3>Edit Player Name</h3>
                        <sp-action-button
                            @click=${this.handleClose}
                            quiet
                            title="Close"
                        >
                            ✕
                        </sp-action-button>
                    </div>
                    <div class="name-edit-modal-body">
                        <sp-textfield
                            .value=${this.inputValue}
                            placeholder="Enter player name"
                            @input=${this.handleInputChange}
                            @keydown=${this.handleKeyDown}
                            autofocus
                        ></sp-textfield>
                    </div>
                    <div class="name-edit-modal-footer">
                        <sp-button
                            variant="secondary"
                            @click=${this.handleClose}
                        >
                            Cancel
                        </sp-button>
                        <sp-button variant="accent" @click=${this.handleSave}>
                            Save
                        </sp-button>
                    </div>
                </div>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [PlayerNameEditModal.TAG_NAME]: PlayerNameEditModal;
    }
}
