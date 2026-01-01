import { css } from "lit";

export const styles = css`
    :host {
        display: block;
    }

    /* Board card placeholder and display */
    .board-card-placeholder,
    .board-card-display {
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

    .board-card-placeholder {
        background: var(--spectrum-global-color-gray-200);
        border: 2px dashed var(--spectrum-global-color-gray-400);
    }

    .board-card-placeholder:hover {
        background: var(--spectrum-global-color-gray-300);
        border-color: var(--spectrum-global-color-gray-500);
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }

    .board-card-placeholder.in-scope {
        background: var(--spectrum-global-color-blue-100);
        border-color: var(--spectrum-global-color-blue-500);
        border-style: solid;
        box-shadow: 0 0 12px var(--spectrum-global-color-blue-400);
        animation: board-scope-pulse 2s ease-in-out infinite;
    }

    .board-card-display {
        background: white;
        border: 2px solid var(--spectrum-global-color-gray-400);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    }

    .board-card-display:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        border-color: var(--spectrum-global-color-gray-600);
    }

    .board-card-display.winning-hand {
        transform: translateY(-8px);
        border-color: rgba(76, 175, 80, 0.8);
        box-shadow: 0 6px 16px rgba(76, 175, 80, 0.4);
        transition: all 0.3s ease;
    }

    .board-card-display.winning-hand:hover {
        transform: translateY(-10px);
        box-shadow: 0 8px 20px rgba(76, 175, 80, 0.5);
    }

    .board-card-display.in-scope {
        border-color: var(--spectrum-global-color-blue-500);
        box-shadow: 0 0 12px var(--spectrum-global-color-blue-400);
        animation: board-scope-pulse 2s ease-in-out infinite;
    }

    @keyframes board-scope-pulse {
        0%,
        100% {
            box-shadow: 0 0 12px var(--spectrum-global-color-blue-400);
        }
        50% {
            box-shadow: 0 0 20px var(--spectrum-global-color-blue-500);
        }
    }

    .board-card-placeholder-content {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
    }

    .board-card-placeholder-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        color: var(--spectrum-global-color-gray-500);
    }

    .board-card-placeholder-icon svg {
        width: 100%;
        height: 100%;
    }

    .board-card-content {
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

    .board-card-rank {
        font-size: var(--spectrum-global-dimension-font-size-400);
        font-weight: var(--spectrum-global-font-weight-bold);
        color: var(--spectrum-global-color-gray-900);
        line-height: 1;
    }

    .board-card-suit-icon {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .board-card-suit-icon svg {
        width: 100%;
        height: 100%;
    }

    /* Responsive scaling for smaller viewports */
    @media (max-width: 900px) {
        .board-card-placeholder,
        .board-card-display {
            width: 55px;
            height: 77px;
            min-width: 55px;
            max-width: 55px;
            min-height: 77px;
            max-height: 77px;
        }

        .board-card-rank {
            font-size: var(--spectrum-global-dimension-font-size-350);
        }

        .board-card-suit-icon {
            width: 22px;
            height: 22px;
        }

        .board-card-placeholder-icon {
            width: 28px;
            height: 28px;
        }
    }

    @media (max-width: 600px) {
        .board-card-placeholder,
        .board-card-display {
            width: 50px;
            height: 70px;
            min-width: 50px;
            max-width: 50px;
            min-height: 70px;
            max-height: 70px;
        }

        .board-card-rank {
            font-size: var(--spectrum-global-dimension-font-size-300);
        }

        .board-card-suit-icon {
            width: 20px;
            height: 20px;
        }

        .board-card-placeholder-icon {
            width: 24px;
            height: 24px;
        }
    }

    @media (max-width: 400px) {
        .board-card-placeholder,
        .board-card-display {
            width: 30px;
            height: 42px;
            min-width: 30px;
            max-width: 30px;
            min-height: 42px;
            max-height: 42px;
        }

        .board-card-rank {
            font-size: var(--spectrum-global-dimension-font-size-175);
        }

        .board-card-suit-icon {
            width: 13px;
            height: 13px;
        }

        .board-card-placeholder-icon {
            width: 14px;
            height: 14px;
        }
    }
`;
