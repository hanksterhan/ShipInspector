import { html } from "lit";
import { styles } from "./styles.css";
import { customElement, property } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { pokerBoardStore } from "../../stores/index";
import "../../components/CardSelector";

/**
 * CardPickerModal component - Modal dialog for card selection
 */
@customElement("card-picker-modal")
export class CardPickerModal extends MobxLitElement {
    static readonly TAG_NAME = "card-picker-modal";
    static get styles() {
        return styles;
    }

    @property({ type: Boolean })
    isOpen: boolean = false;

    handleOverlayClick(e: Event) {
        if (e.target === e.currentTarget) {
            pokerBoardStore.closePicker();
        }
    }

    handleClose() {
        pokerBoardStore.closePicker();
    }

    render() {
        // Use the property if provided, otherwise use the store directly
        const isOpen =
            this.isOpen !== undefined
                ? this.isOpen
                : pokerBoardStore.pickerOpen;

        if (!isOpen) {
            return null;
        }

        return html`
            <div class="picker-modal-overlay" @click=${this.handleOverlayClick}>
                <div class="picker-modal-content">
                    <div class="picker-modal-header">
                        <h3>Select a Card</h3>
                        <sp-action-button
                            @click=${this.handleClose}
                            quiet
                            title="Close"
                        >
                            ✕
                        </sp-action-button>
                    </div>
                    <card-selector></card-selector>
                </div>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [CardPickerModal.TAG_NAME]: CardPickerModal;
    }
}
