import { html, TemplateResult } from "lit";
import { styles } from "./styles.css";
import { customElement } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import {
    handBuilderStore,
    pokerBoardStore,
    PokerBoardStore,
} from "../../stores/index";
import { observable, makeObservable } from "mobx";
import "../PlatformComponents/AlertModal";

@customElement("start-hand-button")
export class StartHandButton extends MobxLitElement {
    static readonly TAG_NAME = "start-hand-button";

    @observable
    validationError: string | null = null;

    constructor() {
        super();
        makeObservable(this);
    }

    static get styles() {
        return styles;
    }

    private validateBeforeStart(): string | null {
        // Check if dealer is set (valid range check)
        const dealerIndex = pokerBoardStore.dealerIndex;
        if (dealerIndex < 0 || dealerIndex >= PokerBoardStore.NUM_PLAYERS) {
            return "Dealer position must be set";
        }

        // Check if at least 1 player has 2 cards selected
        const playersWithCompleteHands =
            pokerBoardStore.getActivePlayersWithCompleteHands();
        if (playersWithCompleteHands.length < 1) {
            return "At least 1 player needs to have 2 cards selected to start";
        }

        return null;
    }

    handleClick() {
        // Clear previous error
        this.validationError = null;

        // If closing the tray, just toggle it
        if (handBuilderStore.handBuilderTrayOpen) {
            handBuilderStore.toggleHandBuilderTray();
            return;
        }

        // Validate before opening the tray
        const error = this.validateBeforeStart();
        if (error) {
            this.validationError = error;
            return;
        }

        // Validation passed, open the tray
        handBuilderStore.toggleHandBuilderTray();
    }

    handleCloseDialog() {
        this.validationError = null;
    }

    render(): TemplateResult {
        const { handBuilderTrayOpen } = handBuilderStore;
        const isDialogOpen = this.validationError !== null;

        return html`
            <div>
                <button
                    class="start-button ${handBuilderTrayOpen ? "active" : ""}"
                    @click=${this.handleClick}
                >
                    ${handBuilderTrayOpen ? "Close Hand Builder" : "Start Hand"}
                </button>
                <alert-modal
                    .isOpen=${isDialogOpen}
                    title="Error"
                    .message=${this.validationError || ""}
                    variant="error"
                    buttonText="ok"
                    @close=${this.handleCloseDialog}
                ></alert-modal>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [StartHandButton.TAG_NAME]: StartHandButton;
    }
}
