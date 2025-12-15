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
`;
