import { css } from "lit";

export const styles = css`
    :host {
        display: block;
        width: 100%;
    }

    .selected-holes-section {
        width: 100%;
        margin-bottom: var(--spectrum-global-dimension-size-300);
        padding: var(--spectrum-global-dimension-size-300);
        padding-bottom: var(--spectrum-global-dimension-size-300);
        border-bottom: 2px solid var(--spectrum-global-color-gray-300);
        background: rgb(255, 255, 255);
        border-radius: var(--spectrum-global-dimension-size-200);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        margin: var(--spectrum-global-dimension-size-200);
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

    .hole-card,
    .hole-card-placeholder {
        width: calc((100% - var(--spectrum-global-dimension-size-75)) / 2);
        max-width: 120px;
        height: auto;
        min-width: 40px;
        min-height: 0;
        aspect-ratio: 5 / 7;
        border-radius: var(--spectrum-global-dimension-size-100);
        border: 2px solid var(--spectrum-global-color-gray-400);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        flex-shrink: 1;
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
        padding: clamp(
            var(--spectrum-global-dimension-size-75),
            5%,
            var(--spectrum-global-dimension-size-150)
        );
    }

    .hole-card-rank {
        font-size: clamp(
            var(--spectrum-global-dimension-font-size-200),
            3.5%,
            var(--spectrum-global-dimension-font-size-500)
        );
        font-weight: var(--spectrum-global-font-weight-bold);
        color: var(--spectrum-global-color-gray-900);
        line-height: 1;
    }

    .hole-card-suit-icon {
        width: clamp(16px, 5%, 32px);
        height: clamp(16px, 5%, 32px);
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
