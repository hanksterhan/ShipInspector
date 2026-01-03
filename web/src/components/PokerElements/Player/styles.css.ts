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

    .player-wrapper.in-scope {
        border: 2px solid #DAA520;
        box-shadow:
            0 2px 8px rgba(255, 215, 0, 0.3),
            0 0 0 2px rgba(255, 215, 0, 0.15);
        animation: scope-highlight 2s ease-in-out infinite;
        z-index: 20;
    }

    @keyframes scope-highlight {
        0%,
        100% {
            box-shadow:
                0 2px 8px rgba(255, 215, 0, 0.3),
                0 0 0 2px rgba(255, 215, 0, 0.15);
        }
        50% {
            box-shadow:
                0 4px 12px rgba(255, 215, 0, 0.4),
                0 0 0 3px rgba(255, 215, 0, 0.2);
        }
    }

    .remove-button {
        position: absolute;
        top: -12px;
        right: -12px;
        width: 24px;
        height: 24px;
        padding: 4px;
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid var(--spectrum-global-color-gray-400);
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
        transition: all 0.2s ease;
        z-index: 40;
    }

    .remove-button:hover {
        background: var(--spectrum-global-color-gray-400);
        border-color: var(--spectrum-global-color-gray-500);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        transform: scale(1.1);
    }

    .remove-button:active {
        transform: scale(0.95);
    }

    .remove-button svg {
        width: 14px;
        height: 14px;
        color: var(--spectrum-global-color-gray-700);
    }

    .remove-button:hover svg {
        color: var(--spectrum-global-color-gray-900);
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
        gap: 2px;
        z-index: 30;
    }

    /* Players 3 and 4 (indices 2 and 3): icons on the left */
    .dealer-overlay.position-2,
    .dealer-overlay.position-3 {
        bottom: 40%;
        left: -48px;
        transform: translateY(50%);
    }

    /* Players 5 and 6 (indices 4 and 5): icons above */
    .dealer-overlay.position-4,
    .dealer-overlay.position-5 {
        bottom: auto;
        top: -48px;
        left: 50%;
        transform: translateX(-50%);
    }

    /* Players 7 and 8 (indices 6 and 7): icons on the right */
    .dealer-overlay.position-6,
    .dealer-overlay.position-7 {
        bottom: 40%;
        left: auto;
        right: -48px;
        transform: translateY(50%);
    }

    .dealer-overlay.has-blinds {
        width: 40px;
        height: 40px;
    }

    .dealer-overlay.selectable {
        cursor: pointer;
    }

    .dealer-overlay.selectable:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        transform: translateX(-50%) scale(1.05);
    }

    .dealer-overlay.position-2.selectable:hover,
    .dealer-overlay.position-3.selectable:hover {
        transform: translateY(50%) scale(1.05);
    }

    .dealer-overlay.position-4.selectable:hover,
    .dealer-overlay.position-5.selectable:hover {
        transform: translateX(-50%) scale(1.05);
    }

    .dealer-overlay.position-6.selectable:hover,
    .dealer-overlay.position-7.selectable:hover {
        transform: translateY(50%) scale(1.05);
    }

    .dealer-overlay svg {
        width: 32px;
        height: 32px;
        color: var(--spectrum-global-color-gray-700);
    }

    .dealer-overlay.has-blinds svg {
        width: 28px;
        height: 28px;
    }

    .blind-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .blind-icon svg {
        width: 28px;
        height: 28px;
        color: var(--spectrum-global-color-gray-700);
    }

    .dealer-selection-circle {
        position: absolute;
        bottom: -28px;
        left: 50%;
        transform: translate(-50%, 50%);
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
        transform: translate(-50%, 50%) scale(1.1);
    }

    /* Players 3 and 4 (indices 2 and 3): selection circle on the left */
    .dealer-selection-circle.position-2,
    .dealer-selection-circle.position-3 {
        bottom: 40%;
        left: -28px;
        transform: translate(-50%, 50%);
    }

    .dealer-selection-circle.position-2:hover,
    .dealer-selection-circle.position-3:hover {
        transform: translate(-50%, 50%) scale(1.1);
    }

    /* Players 5 and 6 (indices 4 and 5): selection circle above */
    .dealer-selection-circle.position-4,
    .dealer-selection-circle.position-5 {
        bottom: auto;
        top: -28px;
        left: 50%;
        transform: translate(-50%, -50%);
    }

    .dealer-selection-circle.position-4:hover,
    .dealer-selection-circle.position-5:hover {
        transform: translate(-50%, -50%) scale(1.1);
    }

    /* Players 7 and 8 (indices 6 and 7): selection circle on the right */
    .dealer-selection-circle.position-6,
    .dealer-selection-circle.position-7 {
        bottom: 40%;
        left: auto;
        right: -28px;
        transform: translate(50%, 50%);
    }

    .dealer-selection-circle.position-6:hover,
    .dealer-selection-circle.position-7:hover {
        transform: translate(50%, 50%) scale(1.1);
    }

    .player-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--spectrum-global-dimension-size-150);
    }

    .player-label-container {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--spectrum-global-dimension-size-75);
        width: 100%;
    }

    .player-label {
        font-size: var(--spectrum-global-dimension-font-size-200);
        font-weight: var(--spectrum-global-font-weight-bold);
        color: var(--spectrum-global-color-gray-800);
        text-align: center;
        flex: 1;
    }

    .player-cards {
        display: flex;
        gap: var(--spectrum-global-dimension-size-100);
        align-items: center;
        justify-content: center;
    }

    .edit-button {
        width: 20px;
        height: 20px;
        padding: 2px;
        background: white;
        border: 1px solid var(--spectrum-global-color-gray-400);
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: all 0.2s ease;
        flex-shrink: 0;
        margin-left: auto;
    }

    .edit-button:hover {
        background: var(--spectrum-global-color-gray-100);
        border-color: var(--spectrum-global-color-gray-600);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        transform: scale(1.05);
    }

    .edit-button:active {
        transform: scale(0.95);
    }

    .edit-button svg {
        width: 14px;
        height: 14px;
        color: var(--spectrum-global-color-gray-600);
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
        border: 2px solid #DAA520;
        border-style: solid;
        box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
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
        border: 2px solid #DAA520;
        box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
        animation: scope-pulse 2s ease-in-out infinite;
    }

    @keyframes scope-pulse {
        0%,
        100% {
            box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
        }
        50% {
            box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
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

        .edit-button {
            width: 18px;
            height: 18px;
        }

        .edit-button svg {
            width: 12px;
            height: 12px;
        }

        .remove-button {
            width: 20px;
            height: 20px;
            top: -10px;
            right: -10px;
        }

        .remove-button svg {
            width: 12px;
            height: 12px;
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

        .edit-button {
            width: 18px;
            height: 18px;
            padding: 2px;
        }

        .edit-button svg {
            width: 12px;
            height: 12px;
        }

        .remove-button {
            width: 20px;
            height: 20px;
            top: -10px;
            right: -10px;
        }

        .remove-button svg {
            width: 12px;
            height: 12px;
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

        .edit-button {
            width: 16px;
            height: 16px;
            padding: 2px;
        }

        .edit-button svg {
            width: 10px;
            height: 10px;
        }

        .remove-button {
            width: 18px;
            height: 18px;
            top: -9px;
            right: -9px;
        }

        .remove-button svg {
            width: 10px;
            height: 10px;
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
