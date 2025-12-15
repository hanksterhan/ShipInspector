import { css } from "lit";

export const styles = css`
    :host {
        display: block;
        width: 100%;
    }

    .hole-selector-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: var(--spectrum-global-dimension-size-300);
        gap: var(--spectrum-global-dimension-size-300);
        background: rgba(255, 255, 255, 0.95);
        border-radius: var(--spectrum-global-dimension-size-200);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        margin: var(--spectrum-global-dimension-size-200);
    }

    .hole-selector-title {
        margin: 0;
        font-size: var(--spectrum-global-dimension-font-size-400);
        font-weight: var(--spectrum-global-font-weight-bold);
        color: var(--spectrum-global-color-gray-800);
    }

    .hole-cards-preview {
        display: flex;
        gap: var(--spectrum-global-dimension-size-200);
        align-items: center;
        justify-content: center;
    }

    .hole-card,
    .hole-card-placeholder {
        width: 100px;
        height: 140px;
        min-width: 100px;
        max-width: 100px;
        min-height: 140px;
        max-height: 140px;
        aspect-ratio: 5 / 7;
        border-radius: var(--spectrum-global-dimension-size-100);
        border: 2px solid var(--spectrum-global-color-gray-400);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
    }

    .hole-card {
        background: white;
    }

    .hole-card-placeholder {
        background: var(--spectrum-global-color-gray-100);
        border-style: dashed;
    }

    .hole-card-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--spectrum-global-dimension-size-75);
        width: 100%;
        height: 100%;
        padding: var(--spectrum-global-dimension-size-150);
    }

    .hole-card-rank {
        font-size: var(--spectrum-global-dimension-font-size-500);
        font-weight: var(--spectrum-global-font-weight-bold);
        color: var(--spectrum-global-color-gray-900);
        line-height: 1;
    }

    .hole-card-suit-icon {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .hole-card-suit-icon svg {
        width: 100%;
        height: 100%;
    }

    .card-number {
        font-size: var(--spectrum-global-dimension-font-size-200);
        color: var(--spectrum-global-color-gray-600);
        font-weight: var(--spectrum-global-font-weight-medium);
    }

    .selection-instruction {
        font-size: var(--spectrum-global-dimension-font-size-300);
        color: var(--spectrum-global-color-gray-700);
        font-weight: var(--spectrum-global-font-weight-medium);
        text-align: center;
    }

    .start-selection-button {
        margin-top: var(--spectrum-global-dimension-size-100);
    }

    .hole-complete-message {
        font-size: var(--spectrum-global-dimension-font-size-300);
        color: var(--spectrum-global-color-gray-700);
        font-weight: var(--spectrum-global-font-weight-medium);
        text-align: center;
        padding: var(--spectrum-global-dimension-size-150);
        background-color: var(--spectrum-global-color-gray-100);
        border-radius: var(--spectrum-global-dimension-size-100);
    }

    .selected-holes-section {
        width: 100%;
        margin-top: var(--spectrum-global-dimension-size-300);
        padding-top: var(--spectrum-global-dimension-size-300);
        border-top: 2px solid var(--spectrum-global-color-gray-300);
    }

    .selected-holes-title {
        margin: 0 0 var(--spectrum-global-dimension-size-200) 0;
        font-size: var(--spectrum-global-dimension-font-size-300);
        font-weight: var(--spectrum-global-font-weight-bold);
        color: var(--spectrum-global-color-gray-800);
        text-align: center;
    }

    .selected-holes-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--spectrum-global-dimension-size-300);
        width: 100%;
    }

    .player-hole-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--spectrum-global-dimension-size-150);
        padding: var(--spectrum-global-dimension-size-200);
        background-color: var(--spectrum-global-color-gray-50);
        border-radius: var(--spectrum-global-dimension-size-100);
        border: 1px solid var(--spectrum-global-color-gray-300);
    }

    .player-label {
        font-size: var(--spectrum-global-dimension-font-size-300);
        font-weight: var(--spectrum-global-font-weight-bold);
        color: var(--spectrum-global-color-gray-800);
    }

    .player-hole-cards {
        display: flex;
        gap: var(--spectrum-global-dimension-size-150);
        align-items: center;
        justify-content: center;
    }
`;
