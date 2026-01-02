import { html } from "lit";
import { styles } from "./styles.css";
import { customElement } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { handBuilderStore } from "../../stores/index";
import { routerStore } from "../../stores/index";

@customElement("save-hand-button")
export class SaveHandButton extends MobxLitElement {
    static readonly TAG_NAME = "save-hand-button";

    static get styles() {
        return styles;
    }

    async handleSave() {
        try {
            const handId = await handBuilderStore.saveHand();
            // Navigate to replay page
            routerStore.navigate(`/replay/${handId}`);
        } catch (error: any) {
            console.error("Failed to save hand:", error);
            // Error is already set in store
        }
    }

    render() {
        const { isSaving, canSave, saveError, validationErrors } =
            handBuilderStore;

        return html`
            <div>
                <button
                    class="save-button"
                    ?disabled=${!canSave || isSaving}
                    @click=${this.handleSave}
                >
                    ${isSaving ? "Saving..." : "Save Hand"}
                </button>
                ${saveError
                    ? html`<div class="error">Error: ${saveError}</div>`
                    : null}
                ${validationErrors.length > 0 && !isSaving
                    ? html`
                          <div class="error">
                              ${validationErrors.join(", ")}
                          </div>
                      `
                    : null}
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [SaveHandButton.TAG_NAME]: SaveHandButton;
    }
}
