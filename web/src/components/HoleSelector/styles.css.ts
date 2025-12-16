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
        background: rgb(255, 255, 255);
        border-radius: var(--spectrum-global-dimension-size-200);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        margin: var(--spectrum-global-dimension-size-200);
        position: relative;
        z-index: 1;
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
        margin-bottom: var(--spectrum-global-dimension-size-300);
        padding-bottom: var(--spectrum-global-dimension-size-300);
        border-bottom: 2px solid var(--spectrum-global-color-gray-300);
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
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: var(--spectrum-global-dimension-size-200);
        width: 100%;
    }

    .player-hole-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--spectrum-global-dimension-size-100);
        padding: var(--spectrum-global-dimension-size-150);
        background-color: var(--spectrum-global-color-gray-50);
        border-radius: var(--spectrum-global-dimension-size-100);
        border: 1px solid var(--spectrum-global-color-gray-300);
        min-width: 0;
        overflow: hidden;
    }

    .player-label {
        font-size: var(--spectrum-global-dimension-font-size-200);
        font-weight: var(--spectrum-global-font-weight-bold);
        color: var(--spectrum-global-color-gray-800);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        width: 100%;
        text-align: center;
    }

    .player-hole-cards {
        display: flex;
        gap: var(--spectrum-global-dimension-size-75);
        align-items: center;
        justify-content: center;
        width: 100%;
        flex-shrink: 1;
        min-width: 0;
    }

    .player-hole-container .hole-card,
    .player-hole-container .hole-card-placeholder {
        width: calc((100% - var(--spectrum-global-dimension-size-75)) / 2);
        max-width: 120px;
        height: auto;
        min-width: 40px;
        min-height: 0;
        aspect-ratio: 5 / 7;
        flex-shrink: 1;
    }

    .player-hole-container .hole-card-content {
        padding: clamp(
            var(--spectrum-global-dimension-size-75),
            5%,
            var(--spectrum-global-dimension-size-150)
        );
    }

    .player-hole-container .hole-card-rank {
        font-size: clamp(
            var(--spectrum-global-dimension-font-size-200),
            3.5%,
            var(--spectrum-global-dimension-font-size-500)
        );
    }

    .player-hole-container .hole-card-suit-icon {
        width: clamp(16px, 5%, 32px);
        height: clamp(16px, 5%, 32px);
    }

    @supports (container-type: inline-size) {
        .player-hole-container {
            container-type: inline-size;
        }

        .player-label {
            font-size: clamp(
                var(--spectrum-global-dimension-font-size-200),
                2.5cqw,
                var(--spectrum-global-dimension-font-size-300)
            );
        }

        .player-hole-container .hole-card-rank {
            font-size: clamp(
                var(--spectrum-global-dimension-font-size-200),
                4cqw,
                var(--spectrum-global-dimension-font-size-500)
            );
        }

        .player-hole-container .hole-card-suit-icon {
            width: clamp(16px, 4cqw, 32px);
            height: clamp(16px, 4cqw, 32px);
        }
    }
`;
