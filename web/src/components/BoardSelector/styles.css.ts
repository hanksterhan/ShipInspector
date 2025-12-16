import { css } from "lit";

export const styles = css`
    :host {
        display: block;
        width: 100%;
    }

    .board-selector-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: var(--spectrum-global-dimension-size-300);
        gap: var(--spectrum-global-dimension-size-300);
        background: rgb(255, 255, 255);
        border-radius: var(--spectrum-global-dimension-size-200);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        margin: var(--spectrum-global-dimension-size-200);
        position: relative;
        z-index: 1;
    }

    .board-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        gap: var(--spectrum-global-dimension-size-200);
    }

    .board-selector-title {
        margin: 0;
        font-size: var(--spectrum-global-dimension-font-size-400);
        font-weight: var(--spectrum-global-font-weight-bold);
        color: var(--spectrum-global-color-gray-800);
        flex: 1;
    }

    .board-actions {
        display: flex;
        gap: var(--spectrum-global-dimension-size-100);
        align-items: center;
    }

    .board-cards-preview {
        display: flex;
        gap: var(--spectrum-global-dimension-size-200);
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;
    }

    .board-card,
    .board-card-placeholder {
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
        position: relative;
    }

    .board-card {
        background: white;
    }

    .board-card-placeholder {
        background: var(--spectrum-global-color-gray-100);
        border-style: dashed;
    }

    .board-card-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--spectrum-global-dimension-size-75);
        width: 100%;
        height: 100%;
        padding: var(--spectrum-global-dimension-size-150);
    }

    .board-card-rank {
        font-size: var(--spectrum-global-dimension-font-size-500);
        font-weight: var(--spectrum-global-font-weight-bold);
        color: var(--spectrum-global-color-gray-900);
        line-height: 1;
    }

    .board-card-suit-icon {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .board-card-suit-icon svg {
        width: 100%;
        height: 100%;
    }

    .card-label {
        font-size: var(--spectrum-global-dimension-font-size-200);
        color: var(--spectrum-global-color-gray-600);
        font-weight: var(--spectrum-global-font-weight-medium);
    }

    .remove-card-button {
        position: absolute;
        top: -8px;
        right: -8px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: var(--spectrum-global-color-red-600);
        color: white;
        border: 2px solid white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        font-weight: bold;
        line-height: 1;
        padding: 0;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        z-index: 10;
        transition: background-color 0.2s;
    }

    .remove-card-button:hover {
        background: var(--spectrum-global-color-red-700);
    }

    .remove-card-button:active {
        background: var(--spectrum-global-color-red-800);
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

    .board-complete-message {
        font-size: var(--spectrum-global-dimension-font-size-300);
        color: var(--spectrum-global-color-gray-700);
        font-weight: var(--spectrum-global-font-weight-medium);
        text-align: center;
        padding: var(--spectrum-global-dimension-size-150);
        background-color: var(--spectrum-global-color-gray-100);
        border-radius: var(--spectrum-global-dimension-size-100);
    }
`;
