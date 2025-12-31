import { css } from "lit";

export const styles = css`
    :host {
        display: block;
    }

    .player-wrapper {
        background: rgba(220, 220, 220, 0.95);
        border-radius: var(--spectrum-global-dimension-size-200);
        padding: var(--spectrum-global-dimension-size-200);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
        backdrop-filter: blur(4px);
        border: 1px solid rgba(180, 180, 180, 0.6);
    }

    .player-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--spectrum-global-dimension-size-150);
    }

    .player-label {
        font-size: var(--spectrum-global-dimension-font-size-200);
        font-weight: var(--spectrum-global-font-weight-bold);
        color: var(--spectrum-global-color-gray-800);
        text-align: center;
    }

    .player-cards {
        display: flex;
        gap: var(--spectrum-global-dimension-size-100);
        align-items: center;
        justify-content: center;
    }

    .card-placeholder,
    .card-display {
        width: 60px;
        height: 84px;
        min-width: 60px;
        max-width: 60px;
        min-height: 84px;
        max-height: 84px;
        aspect-ratio: 5 / 7;
        border-radius: var(--spectrum-global-dimension-size-100);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s ease;
        box-sizing: border-box;
    }

    .card-placeholder {
        background: var(--spectrum-global-color-gray-200);
        border: 2px dashed var(--spectrum-global-color-gray-400);
    }

    .card-placeholder:hover {
        background: var(--spectrum-global-color-gray-300);
        border-color: var(--spectrum-global-color-gray-500);
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }

    .card-placeholder.in-scope {
        background: var(--spectrum-global-color-blue-100);
        border-color: var(--spectrum-global-color-blue-500);
        border-style: solid;
        box-shadow: 0 0 12px var(--spectrum-global-color-blue-400);
        animation: scope-pulse 2s ease-in-out infinite;
    }

    .card-display {
        background: white;
        border: 2px solid var(--spectrum-global-color-gray-400);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    }

    .card-display:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        border-color: var(--spectrum-global-color-gray-600);
    }

    .card-display.in-scope {
        border-color: var(--spectrum-global-color-blue-500);
        box-shadow: 0 0 12px var(--spectrum-global-color-blue-400);
        animation: scope-pulse 2s ease-in-out infinite;
    }

    @keyframes scope-pulse {
        0%,
        100% {
            box-shadow: 0 0 12px var(--spectrum-global-color-blue-400);
        }
        50% {
            box-shadow: 0 0 20px var(--spectrum-global-color-blue-500);
        }
    }

    .placeholder-content {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
    }

    .placeholder-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        color: var(--spectrum-global-color-gray-500);
    }

    .placeholder-icon svg {
        width: 100%;
        height: 100%;
    }

    .card-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--spectrum-global-dimension-size-50);
        width: 100%;
        height: 100%;
        padding: var(--spectrum-global-dimension-size-75);
        box-sizing: border-box;
    }

    .card-rank {
        font-size: var(--spectrum-global-dimension-font-size-400);
        font-weight: var(--spectrum-global-font-weight-bold);
        color: var(--spectrum-global-color-gray-900);
        line-height: 1;
    }

    .card-suit-icon {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .card-suit-icon svg {
        width: 100%;
        height: 100%;
    }

    .player-equity {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--spectrum-global-dimension-size-50);
        margin-top: var(--spectrum-global-dimension-size-75);
        padding: var(--spectrum-global-dimension-size-50)
            var(--spectrum-global-dimension-size-100);
        background: rgba(255, 255, 255, 0.8);
        border-radius: var(--spectrum-global-dimension-size-100);
        border: 1px solid rgba(0, 0, 0, 0.1);
    }

    .equity-win {
        font-size: var(--spectrum-global-dimension-font-size-200);
        font-weight: var(--spectrum-global-font-weight-bold);
        color: #00a86b; /* Money green */
        text-align: center;
    }

    .equity-tie {
        font-size: var(--spectrum-global-dimension-font-size-200);
        font-weight: var(--spectrum-global-font-weight-bold);
        color: #ff8c00; /* Orange */
        text-align: center;
    }

    @media (max-width: 600px) {
        .card-placeholder,
        .card-display {
            width: 50px;
            height: 70px;
            min-width: 50px;
            max-width: 50px;
            min-height: 70px;
            max-height: 70px;
        }

        .card-rank {
            font-size: var(--spectrum-global-dimension-font-size-300);
        }

        .card-suit-icon {
            width: 20px;
            height: 20px;
        }

        .placeholder-icon {
            width: 24px;
            height: 24px;
        }
    }
`;
