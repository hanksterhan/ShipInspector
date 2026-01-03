import { html, nothing } from "lit";
import { styles } from "./styles.css";
import { customElement, property } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";

/**
 * AlertModal component - Reusable modal dialog for displaying alerts and messages
 */
@customElement("alert-modal")
export class AlertModal extends MobxLitElement {
    static readonly TAG_NAME = "alert-modal";
    static get styles() {
        return styles;
    }

    @property({ type: Boolean })
    isOpen: boolean = false;

    @property({ type: String })
    title: string = "";

    @property({ type: String })
    message: string = "";

    @property({ type: String })
    variant: "error" | "warning" | "info" = "info";

    @property({ type: String })
    buttonText: string = "OK";

    handleOverlayClick(e: Event) {
        if (e.target === e.currentTarget) {
            this.handleClose();
        }
    }

    handleClose() {
        this.dispatchEvent(
            new CustomEvent("close", {
                bubbles: true,
                composed: true,
            })
        );
    }

    render(): TemplateResultOrNothing {
        if (!this.isOpen) {
            return nothing;
        }

        const variantClass = `alert-dialog-${this.variant}`;

        return html`
            <div class="alert-overlay" @click=${this.handleOverlayClick}>
                <div
                    class="alert-dialog-content ${variantClass}"
                    @click=${(e: Event) => e.stopPropagation()}
                >
                    ${this.title
                        ? html`
                              <div class="alert-dialog-header">
                                  <h2>${this.title}</h2>
                              </div>
                          `
                        : null}
                    <div class="alert-dialog-body">${this.message}</div>
                    <div class="alert-dialog-footer">
                        <sp-button variant="primary" @click=${this.handleClose}>
                            ${this.buttonText}
                        </sp-button>
                    </div>
                </div>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [AlertModal.TAG_NAME]: AlertModal;
    }
}
