import { css } from "lit";

export const styles = css`
    :host {
        display: block;
    }

    .player-wrapper {
        background: rgba(220, 220, 220, 0.95);
        border-radius: var(--spectrum-global-dimension-size-200);
        padding: var(--spectrum-global-dimension-size-100)
            var(--spectrum-global-dimension-size-200);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
        backdrop-filter: blur(4px);
        border: 1px solid rgba(180, 180, 180, 0.6);
        transition: all 0.3s ease;
        position: relative;
    }

    .player-wrapper.folded {
        opacity: 0.5;
        filter: grayscale(0.5);
    }

    .player-wrapper.hero {
        border: 2px solid var(--spectrum-global-color-blue-500);
    }

    .player-wrapper.active-actor {
        border: 2px solid var(--spectrum-global-color-yellow-400);
        box-shadow: 0 0 0 3px rgba(255, 214, 10, 0.35);
    }

    .player-wrapper.winner {
        background: rgba(76, 175, 80, 1);
        border: 3px solid rgba(56, 142, 60, 1);
        box-shadow:
            0 8px 24px rgba(0, 0, 0, 0.4),
            0 4px 16px rgba(76, 175, 80, 0.6);
        animation: winner-glow 2s ease-in-out infinite;
    }

    @keyframes winner-glow {
        0%,
        100% {
            box-shadow:
                0 8px 24px rgba(0, 0, 0, 0.4),
                0 4px 16px rgba(76, 175, 80, 0.6);
        }
        50% {
            box-shadow:
                0 10px 32px rgba(0, 0, 0, 0.5),
                0 6px 24px rgba(76, 175, 80, 0.8);
        }
    }

    .player-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--spectrum-global-dimension-size-100);
    }

    .player-label {
        font-size: var(--spectrum-global-dimension-font-size-200);
        font-weight: var(--spectrum-global-font-weight-bold);
        color: var(--spectrum-global-color-gray-800);
        text-align: center;
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .hero-badge {
        color: var(--spectrum-global-color-blue-500);
        font-size: 14px;
    }

    .stack-label {
        font-size: var(--spectrum-global-dimension-font-size-100);
        color: var(--spectrum-global-color-gray-700);
    }

    .all-in-label {
        font-size: var(--spectrum-global-dimension-font-size-100);
        color: var(--spectrum-global-color-red-600);
        font-weight: var(--spectrum-global-font-weight-bold);
    }

    .player-cards {
        display: flex;
        gap: var(--spectrum-global-dimension-size-75);
        align-items: center;
        justify-content: center;
    }

    .card-back,
    .card-display {
        width: 50px;
        height: 70px;
        border-radius: var(--spectrum-global-dimension-size-75);
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
    }

    .card-back {
        background: linear-gradient(135deg, #1a5276 0%, #154360 100%);
        border: 2px solid #0e3a5e;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        color: rgba(255, 255, 255, 0.3);
    }

    .card-back svg {
        width: 30px;
        height: 30px;
    }

    .card-display {
        background: white;
        border: 2px solid var(--spectrum-global-color-gray-400);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    }

    .card-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        width: 100%;
        height: 100%;
        padding: var(--spectrum-global-dimension-size-50);
        box-sizing: border-box;
    }

    .card-rank {
        font-size: var(--spectrum-global-dimension-font-size-300);
        font-weight: var(--spectrum-global-font-weight-bold);
        color: var(--spectrum-global-color-gray-900);
        line-height: 1;
    }

    .card-suit-icon {
        width: 18px;
        height: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .card-suit-icon svg {
        width: 100%;
        height: 100%;
    }

    .folded-label {
        font-size: var(--spectrum-global-dimension-font-size-100);
        color: var(--spectrum-global-color-gray-600);
        font-style: italic;
    }

    .current-bet {
        font-size: var(--spectrum-global-dimension-font-size-200);
        font-weight: var(--spectrum-global-font-weight-bold);
        color: var(--spectrum-global-color-green-600);
        background: rgba(255, 255, 255, 0.9);
        padding: 2px 8px;
        border-radius: 4px;
    }

    /* Responsive scaling */
    @media (max-width: 600px) {
        .card-back,
        .card-display {
            width: 40px;
            height: 56px;
        }

        .card-rank {
            font-size: var(--spectrum-global-dimension-font-size-200);
        }

        .card-suit-icon {
            width: 14px;
            height: 14px;
        }
    }
`;
