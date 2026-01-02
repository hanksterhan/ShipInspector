import { css } from "lit";

export const styles = css`
    :host {
        display: block;
    }

    .player-wrapper {
        background: rgba(220, 220, 220, 0.95);
        border-radius: var(--spectrum-global-dimension-size-200);
        padding: var(--spectrum-global-dimension-size-100)
            var(--spectrum-global-dimension-size-200)
            var(--spectrum-global-dimension-size-100)
            var(--spectrum-global-dimension-size-200);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
        backdrop-filter: blur(4px);
        border: 1px solid rgba(180, 180, 180, 0.6);
        transition: all 0.3s ease;
        position: relative;
    }

    .player-wrapper.winner {
        background: rgba(
            76,
            175,
            80,
            1
        ); /* Victory green - fully opaque for better contrast */
        border: 3px solid rgba(56, 142, 60, 1);
        box-shadow:
            0 8px 24px rgba(0, 0, 0, 0.4),
            0 4px 16px rgba(76, 175, 80, 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        animation: winner-glow 2s ease-in-out infinite;
        z-index: 30; /* Ensure winner appears above other players */
    }

    @keyframes winner-glow {
        0%,
        100% {
            box-shadow:
                0 8px 24px rgba(0, 0, 0, 0.4),
                0 4px 16px rgba(76, 175, 80, 0.6),
                inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        50% {
            box-shadow:
                0 10px 32px rgba(0, 0, 0, 0.5),
                0 6px 24px rgba(76, 175, 80, 0.8),
                inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
    }

    .crown-overlay {
        position: absolute;
        top: -32px;
        left: 50%;
        transform: translateX(-50%);
        width: 48px;
        height: 48px;
        color: #ffd700; /* Gold color for crown */
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))
            drop-shadow(0 0 8px rgba(255, 215, 0, 0.6));
        z-index: 35;
        animation: crown-float 2s ease-in-out infinite;
    }

    .crown-overlay svg {
        width: 100%;
        height: 100%;
    }

    @keyframes crown-float {
        0%,
        100% {
            transform: translateX(-50%) translateY(0);
        }
        50% {
            transform: translateX(-50%) translateY(-4px);
        }
    }

    .dealer-overlay {
        position: absolute;
        bottom: -48px;
        left: 50%;
        transform: translateX(-50%);
        background: white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        border-radius: 50%;
        width: 40px;
        height: 40px;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 30;
    }

    .dealer-overlay.selectable {
        cursor: pointer;
    }

    .dealer-overlay.selectable:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        transform: translateX(-50%) scale(1.05);
    }

    .dealer-overlay svg {
        width: 28px;
        height: 28px;
        color: var(--spectrum-global-color-gray-700);
    }

    .dealer-selection-circle {
        position: absolute;
        bottom: -56px;
        left: 50%;
        transform: translateX(-50%);
        width: 56px;
        height: 56px;
        border: 2px dotted var(--spectrum-global-color-gray-500);
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        cursor: pointer;
        z-index: 25;
        transition: all 0.2s ease;
    }

    .dealer-selection-circle:hover {
        border-color: var(--spectrum-global-color-blue-500);
        background: rgba(59, 130, 246, 0.1);
        border-width: 3px;
        transform: translateX(-50%) scale(1.1);
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
        padding: var(--spectrum-global-dimension-size-25)
            var(--spectrum-global-dimension-size-75);
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

    /* Responsive scaling for smaller viewports */
    @media (max-width: 900px) {
        .player-wrapper {
            padding: var(--spectrum-global-dimension-size-75)
                var(--spectrum-global-dimension-size-150)
                var(--spectrum-global-dimension-size-75)
                var(--spectrum-global-dimension-size-150);
        }

        .player-label {
            font-size: var(--spectrum-global-dimension-font-size-175);
        }

        .card-placeholder,
        .card-display {
            width: 55px;
            height: 77px;
            min-width: 55px;
            max-width: 55px;
            min-height: 77px;
            max-height: 77px;
        }

        .card-rank {
            font-size: var(--spectrum-global-dimension-font-size-350);
        }

        .card-suit-icon {
            width: 22px;
            height: 22px;
        }

        .placeholder-icon {
            width: 28px;
            height: 28px;
        }

        .equity-win,
        .equity-tie {
            font-size: var(--spectrum-global-dimension-font-size-175);
        }
    }

    @media (max-width: 600px) {
        .player-wrapper {
            padding: var(--spectrum-global-dimension-size-50)
                var(--spectrum-global-dimension-size-100)
                var(--spectrum-global-dimension-size-50)
                var(--spectrum-global-dimension-size-100);
        }

        .player-label {
            font-size: var(--spectrum-global-dimension-font-size-150);
        }

        .player-container {
            gap: var(--spectrum-global-dimension-size-100);
        }

        .player-cards {
            gap: var(--spectrum-global-dimension-size-75);
        }

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

        .equity-win,
        .equity-tie {
            font-size: var(--spectrum-global-dimension-font-size-150);
        }

        .player-equity {
            padding: var(--spectrum-global-dimension-size-25)
                var(--spectrum-global-dimension-size-50);
        }
    }

    @media (max-width: 400px) {
        .player-wrapper {
            padding: var(--spectrum-global-dimension-size-50)
                var(--spectrum-global-dimension-size-50)
                var(--spectrum-global-dimension-size-50)
                var(--spectrum-global-dimension-size-50);
        }

        .player-label {
            font-size: var(--spectrum-global-dimension-font-size-100);
        }

        .player-container {
            gap: var(--spectrum-global-dimension-size-50);
        }

        .player-cards {
            gap: var(--spectrum-global-dimension-size-50);
        }

        .card-placeholder,
        .card-display {
            width: 30px;
            height: 42px;
            min-width: 30px;
            max-width: 30px;
            min-height: 42px;
            max-height: 42px;
        }

        .card-rank {
            font-size: var(--spectrum-global-dimension-font-size-175);
        }

        .card-suit-icon {
            width: 13px;
            height: 13px;
        }

        .placeholder-icon {
            width: 14px;
            height: 14px;
        }

        .equity-win,
        .equity-tie {
            font-size: var(--spectrum-global-dimension-font-size-100);
        }

        .player-equity {
            padding: var(--spectrum-global-dimension-size-25)
                var(--spectrum-global-dimension-size-50);
        }
    }
`;
