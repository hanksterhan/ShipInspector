import { html } from "lit";
import { styles } from "./styles.css";
import { customElement } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { pokerBoardStore, handBuilderStore } from "../../../stores/index";

/**
 * BlindControls component - Allows editing small blind and big blind amounts
 */
@customElement("blind-controls")
export class BlindControls extends MobxLitElement {
    static readonly TAG_NAME = "blind-controls";
    static get styles() {
        return styles;
    }

    private smallBlindValue: string = "";
    private bigBlindValue: string = "";
    private defaultStackValue: string = "";
    private smallBlindInvalid: boolean = false;
    private bigBlindInvalid: boolean = false;
    private defaultStackInvalid: boolean = false;

    connectedCallback() {
        super.connectedCallback();
        // Initialize values from store
        this.smallBlindValue = pokerBoardStore.smallBlind.toString();
        this.bigBlindValue = pokerBoardStore.bigBlind.toString();
        this.defaultStackValue = pokerBoardStore.defaultStack.toString();
    }

    private isNumeric(value: string): boolean {
        if (value === "" || value === null || value === undefined) {
            return false;
        }
        const num = Number(value);
        return !isNaN(num) && isFinite(num);
    }

    handleSmallBlindChange(e: Event) {
        const target = e.target as any;
        const value = target.value || "";
        this.smallBlindValue = value;

        if (this.isNumeric(value)) {
            const numValue = parseInt(value, 10);
            if (!isNaN(numValue) && numValue >= 0) {
                this.smallBlindInvalid = false;
                pokerBoardStore.setSmallBlind(numValue);
            } else {
                this.smallBlindInvalid = true;
            }
        } else {
            this.smallBlindInvalid = true;
        }
        this.requestUpdate();
    }

    handleBigBlindChange(e: Event) {
        const target = e.target as any;
        const value = target.value || "";
        this.bigBlindValue = value;

        if (this.isNumeric(value)) {
            const numValue = parseInt(value, 10);
            if (!isNaN(numValue) && numValue >= 0) {
                this.bigBlindInvalid = false;
                pokerBoardStore.setBigBlind(numValue);
            } else {
                this.bigBlindInvalid = true;
            }
        } else {
            this.bigBlindInvalid = true;
        }
        this.requestUpdate();
    }

    handleDefaultStackChange(e: Event) {
        const target = e.target as any;
        const value = target.value || "";
        this.defaultStackValue = value;

        if (this.isNumeric(value)) {
            const numValue = parseInt(value, 10);
            if (!isNaN(numValue) && numValue >= 0) {
                this.defaultStackInvalid = false;
                pokerBoardStore.setDefaultStack(numValue);
                // Update all player stacks in handBuilderStore
                handBuilderStore.updateAllPlayerStacksToDefault(numValue);
            } else {
                this.defaultStackInvalid = true;
            }
        } else {
            this.defaultStackInvalid = true;
        }
        this.requestUpdate();
    }

    render() {
        return html`
            <div class="blind-controls-container">
                <div class="blind-input-group">
                    <sp-field-label for="small-blind-input">SB</sp-field-label>
                    <sp-textfield
                        id="small-blind-input"
                        type="text"
                        .value=${this.smallBlindValue}
                        @input=${this.handleSmallBlindChange}
                        required
                        ?invalid=${this.smallBlindInvalid}
                    ></sp-textfield>
                </div>
                <div class="blind-input-group">
                    <sp-field-label for="big-blind-input">BB</sp-field-label>
                    <sp-textfield
                        id="big-blind-input"
                        type="text"
                        .value=${this.bigBlindValue}
                        @input=${this.handleBigBlindChange}
                        required
                        ?invalid=${this.bigBlindInvalid}
                    ></sp-textfield>
                </div>
                <div class="blind-input-group">
                    <sp-field-label for="default-stack-input"
                        >Default stack</sp-field-label
                    >
                    <sp-textfield
                        id="default-stack-input"
                        type="text"
                        .value=${this.defaultStackValue}
                        @input=${this.handleDefaultStackChange}
                        required
                        ?invalid=${this.defaultStackInvalid}
                    ></sp-textfield>
                </div>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [BlindControls.TAG_NAME]: BlindControls;
    }
}
