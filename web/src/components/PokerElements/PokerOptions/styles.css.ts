import { css } from "lit";

export const styles = css`
    :host {
        display: block;
        width: 100%;
    }

    .player-selector-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: var(--spectrum-global-dimension-size-300);
        padding-top: calc(var(--spectrum-global-dimension-size-300));
        gap: var(--spectrum-global-dimension-size-200);
        width: 100%;
        max-width: 600px;
        margin: 0 auto;
        background: rgb(255, 255, 255);
        border-radius: var(--spectrum-global-dimension-size-200);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        position: relative;
        z-index: 1;
    }

    .close-button {
        position: absolute;
        top: var(--spectrum-global-dimension-size-50);
        right: var(--spectrum-global-dimension-size-50);
        z-index: 101;
        background: transparent;
        border-radius: 0;
        width: auto;
        height: auto;
        padding: 0;
        min-width: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0;
    }

    .close-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
    }

    .close-icon svg {
        width: 32px;
        height: 32px;
    }

    .mode-selectors-row {
        display: flex;
        flex-direction: row;
        gap: var(--spectrum-global-dimension-size-300);
        width: 100%;
        align-items: flex-start;
    }

    .card-selection-mode-container {
        display: flex;
        flex-direction: column;
        gap: var(--spectrum-global-dimension-size-150);
        flex: 1;
        padding: var(--spectrum-global-dimension-size-200);
        background-color: var(--spectrum-global-color-gray-50);
        border-radius: var(--spectrum-global-dimension-size-100);
        border: 1px solid var(--spectrum-global-color-gray-200);
    }

    .equity-calculation-mode-container {
        display: flex;
        flex-direction: column;
        gap: var(--spectrum-global-dimension-size-150);
        flex: 1;
        padding: var(--spectrum-global-dimension-size-200);
        background-color: var(--spectrum-global-color-gray-50);
        border-radius: var(--spectrum-global-dimension-size-100);
        border: 1px solid var(--spectrum-global-color-gray-200);
    }

    .selection-mode-buttons {
        width: auto;
    }

    @media (max-width: 768px) {
        .mode-selectors-row {
            flex-direction: column;
        }
    }
`;
