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
        gap: var(--spectrum-global-dimension-size-200);
        width: 100%;
        max-width: 500px;
        margin: 0 auto;
        background: rgba(255, 255, 255, 0.95);
        border-radius: var(--spectrum-global-dimension-size-200);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    }

    .player-slider {
        width: 100%;
        --spectrum-slider-track-color: var(--spectrum-global-color-gray-300);
        --spectrum-slider-track-color-disabled: var(
            --spectrum-global-color-gray-200
        );
        --spectrum-slider-handle-color: var(--spectrum-global-color-blue-600);
        --spectrum-slider-handle-color-hover: var(
            --spectrum-global-color-blue-700
        );
        --spectrum-slider-handle-color-key-focus: var(
            --spectrum-global-color-blue-600
        );
        --spectrum-slider-track-fill-color: var(
            --spectrum-global-color-blue-500
        );
    }

    sp-slider::part(label) {
        color: var(--spectrum-global-color-gray-800);
        font-weight: var(--spectrum-global-font-weight-medium);
    }
`;
