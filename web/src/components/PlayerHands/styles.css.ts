import { css } from "lit";

export const styles = css`
    :host {
        display: block;
    }

    .player-hands-container {
        display: flex;
        flex-direction: column;
        gap: 24px;
    }

    .player-hand {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
    }

    .player-label {
        font-size: 16px;
        font-weight: 600;
        color: #333;
    }

    .hole-cards {
        display: flex;
        gap: 8px;
    }

    .hole-slot {
        position: relative;
        width: 70px;
        height: 98px;
    }

    .hole-slot.in-scope {
        animation: glow 2s ease-in-out infinite;
    }

    @keyframes glow {
        0%,
        100% {
            box-shadow: 0 0 0 0 rgba(0, 123, 255, 0.4);
        }
        50% {
            box-shadow: 0 0 0 4px rgba(0, 123, 255, 0.4);
        }
    }

    .card-back {
        width: 70px;
        height: 98px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 8px;
        border: 2px solid #333;
        position: relative;
        cursor: pointer;
        transition: transform 0.2s;
    }

    .card-back:hover {
        transform: translateY(-4px);
    }

    .plus-overlay {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: white;
        pointer-events: none;
        opacity: 0.8;
    }

    .plus-overlay svg {
        width: 28px;
        height: 28px;
    }

    .hole-card {
        width: 70px;
        height: 98px;
        background: white;
        border: 2px solid #333;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: transform 0.2s;
        position: relative;
    }

    .hole-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .card-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
    }

    .card-rank {
        font-size: 18px;
        font-weight: 600;
    }

    .card-suit-icon {
        font-size: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .card-suit-icon svg {
        width: 20px;
        height: 20px;
    }

    .clear-button {
        position: absolute;
        top: -8px;
        right: -8px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #dc3545;
        color: white;
        border: 2px solid white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        font-weight: bold;
        line-height: 1;
        z-index: 10;
        transition: all 0.2s;
    }

    .clear-button:hover {
        background: #c82333;
        transform: scale(1.1);
    }
`;
