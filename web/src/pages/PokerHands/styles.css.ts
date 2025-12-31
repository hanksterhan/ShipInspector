import { css } from "lit";

export const styles = css`
    :host {
        display: block;
        padding: 16px;
    }

    .poker-hands-wrapper {
        display: flex;
        justify-content: center;
        width: 100%;
    }

    .poker-hands-container {
        width: 100%;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        padding: 40px 32px;
        display: flex;
        flex-direction: column;
        gap: 24px;
    }

    .poker-hands-content {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        width: 100%;
        padding-top: 60px;
        padding-bottom: 20px;
        gap: 24px;
    }

    .outs-display-container {
        display: flex;
        justify-content: center;
        width: 100%;
        padding: 0 32px;
    }

    .player-hands-section {
        display: flex;
        justify-content: center;
    }

    .board-section {
        display: flex;
        justify-content: center;
        position: relative;
    }

    .equity-section {
        display: flex;
        justify-content: center;
    }

    /* Table SVG Container */
    .table-svg-container {
        position: relative;
        width: 100%;
        max-width: 1200px;
        /* Maintain 2:1 aspect ratio based on SVG viewBox (1200x600) */
        aspect-ratio: 2 / 1;
        display: block;
        overflow: visible;
    }

    /* Background layer - scales with container */
    .table-svg-background {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 0;
        pointer-events: none;
    }

    .table-svg-background svg.poker-table-svg {
        width: 100%;
        height: 100%;
        display: block;
    }

    /* Content overlay layer - for components on top */
    .table-content-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10;
        pointer-events: none;
    }

    /* Allow pointer events on child components */
    .table-content-overlay > * {
        pointer-events: auto;
    }

    /* Individual player positions around the table */
    .player-position {
        position: absolute;
        z-index: 20;
    }

    /* Board cards container - centered in the middle of the table */
    .board-cards-container {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        gap: var(--spectrum-global-dimension-size-100);
        align-items: center;
        justify-content: center;
        z-index: 15;
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

    /* Add Player button */
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

    /* Felt realism enhancements */
    /* Inner felt area: x=80, y=80, w=1040, h=440 in viewBox "0 0 1200 600" */
    /* As percentages: left=6.67%, top=13.33%, right=6.67%, bottom=13.33% */
    .table-svg-background::before {
        content: "";
        position: absolute;
        top: 13.33%;
        left: 6.67%;
        right: 6.67%;
        bottom: 13.33%;
        border-radius: 36.67%; /* 220/600 ≈ 36.67% of height */
        pointer-events: none;
        z-index: 2;
        /* Vignette effect with noise */
        background:
            repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(255, 255, 255, 0.015) 2px,
                rgba(255, 255, 255, 0.015) 4px
            ),
            repeating-linear-gradient(
                90deg,
                transparent,
                transparent 2px,
                rgba(0, 0, 0, 0.015) 2px,
                rgba(0, 0, 0, 0.015) 4px
            ),
            radial-gradient(
                ellipse at center,
                transparent 0%,
                transparent 60%,
                rgba(0, 0, 0, 0.2) 100%
            );
    }

    /* Inner felt lighting */
    .table-svg-background::after {
        content: "";
        position: absolute;
        top: 13.33%;
        left: 6.67%;
        right: 6.67%;
        bottom: 13.33%;
        border-radius: 36.67%;
        pointer-events: none;
        z-index: 3;
        /* Top center highlight and edge darkening */
        background:
            radial-gradient(
                ellipse 100% 50% at 50% 25%,
                rgba(255, 255, 255, 0.1) 0%,
                transparent 50%
            ),
            radial-gradient(
                ellipse at center,
                transparent 65%,
                rgba(0, 0, 0, 0.15) 100%
            );
    }

    /* Board zone styling - use CSS variables with fallbacks */
    .table-svg-background svg .board-zone {
        stroke: var(--board-zone-stroke-inactive, rgba(255, 255, 255, 0.08));
        stroke-dasharray: 8 8;
        stroke-width: 1;
        transition:
            stroke 0.3s ease,
            filter 0.3s ease,
            stroke-width 0.3s ease;
        filter: none;
    }

    /* Board zone glow when board cards are in scope */
    .table-svg-container.board-in-scope .table-svg-background svg .board-zone {
        stroke: var(--board-zone-stroke, rgba(255, 255, 255, 0.25));
        stroke-width: 1.5;
        filter: drop-shadow(
            0 0 8px var(--glow-color-board, rgba(100, 150, 255, 0.6))
        );
        animation: board-zone-pulse 2s ease-in-out infinite;
    }

    @keyframes board-zone-pulse {
        0%,
        100% {
            filter: drop-shadow(
                0 0 8px var(--glow-color-board, rgba(100, 150, 255, 0.6))
            );
            stroke-width: 1.5;
        }
        50% {
            filter: drop-shadow(
                    0 0 16px var(--glow-color-board, rgba(100, 150, 255, 0.6))
                )
                drop-shadow(
                    0 0 24px var(--glow-color-board, rgba(100, 150, 255, 0.6))
                );
            stroke-width: 2;
        }
    }

    /* Board zone visible when board is active but not in scope */
    .table-svg-container.board-active:not(.board-in-scope)
        .table-svg-background
        svg
        .board-zone {
        stroke: var(--board-zone-stroke, rgba(255, 255, 255, 0.25));
        stroke-dasharray: 8 8;
        stroke-width: 1;
    }

    /* Player card container glow when player cards are in scope */
    .player-hands-section.player-in-scope {
        position: relative;
    }

    .player-hands-section.player-in-scope::before {
        content: "";
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: calc(100% + 40px);
        height: calc(100% + 40px);
        border-radius: 12px;
        background: radial-gradient(
            ellipse at center,
            var(--glow-color-player) 0%,
            transparent 70%
        );
        filter: blur(12px);
        pointer-events: none;
        z-index: 0;
        opacity: 0.6;
        animation: player-glow-pulse 2s ease-in-out infinite;
    }

    @keyframes player-glow-pulse {
        0%,
        100% {
            opacity: 0.4;
        }
        50% {
            opacity: 0.7;
        }
    }

    .player-hands-section.player-in-scope player-hands {
        position: relative;
        z-index: 1;
    }

    /* Card Picker Modal */
    .picker-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        animation: fadeIn 0.2s ease-in;
    }

    .picker-modal-content {
        background: white;
        border-radius: var(--spectrum-global-dimension-size-200);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        max-width: 90vw;
        max-height: 90vh;
        overflow: auto;
        position: relative;
        animation: slideUp 0.3s ease-out;
    }

    .picker-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spectrum-global-dimension-size-300);
        border-bottom: 1px solid var(--spectrum-global-color-gray-200);
    }

    .picker-modal-header h3 {
        margin: 0;
        font-size: var(--spectrum-global-dimension-font-size-400);
        font-weight: var(--spectrum-global-font-weight-bold);
        color: var(--spectrum-global-color-gray-800);
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    @keyframes slideUp {
        from {
            transform: translateY(20px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
`;
