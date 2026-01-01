import { css } from "lit";

export const styles = css`
    :host {
        display: block;
    }

    .add-player-button {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: var(--spectrum-global-dimension-size-100);
        padding: var(--spectrum-global-dimension-size-150);
        background: rgba(220, 220, 220, 0.95);
        border: 2px dashed var(--spectrum-global-color-gray-400);
        border-radius: var(--spectrum-global-dimension-size-200);
        cursor: pointer;
        transition: all 0.3s ease;
        min-width: 120px;
        min-height: 60px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
        backdrop-filter: blur(4px);
        white-space: nowrap;
    }

    .add-player-button:hover {
        background: rgba(240, 240, 240, 0.95);
        border-color: var(--spectrum-global-color-gray-500);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .add-player-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        color: var(--spectrum-global-color-gray-600);
        flex-shrink: 0;
    }

    .add-player-icon svg {
        width: 100%;
        height: 100%;
    }

    .add-player-text {
        font-size: var(--spectrum-global-dimension-font-size-200);
        font-weight: var(--spectrum-global-font-weight-medium);
        color: var(--spectrum-global-color-gray-700);
        white-space: nowrap;
    }
`;
