import { css } from "lit";

export const styles = css`
    :host {
        display: block;
        padding: 8px;
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
        justify-content: center;
        align-items: center;
        width: 100%;
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
        max-width: 1000px;
        display: inline-block;
    }

    .table-svg-wrapper {
        position: relative;
        width: 100%;
        display: block;
    }

    .table-svg-wrapper svg.poker-table-svg {
        width: 100%;
        height: auto;
        display: block;
        position: relative;
        z-index: 1;
    }

    /* Felt realism enhancements */
    /* Inner felt area: x=80, y=80, w=840, h=440 in viewBox "0 0 1000 600" */
    /* As percentages: left=8%, top=13.33%, right=8%, bottom=13.33% */
    .table-svg-wrapper::before {
        content: "";
        position: absolute;
        top: 13.33%;
        left: 8%;
        right: 8%;
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
    .table-svg-wrapper::after {
        content: "";
        position: absolute;
        top: 13.33%;
        left: 8%;
        right: 8%;
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
    .table-svg-wrapper svg .board-zone {
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
    .table-svg-container.board-in-scope .table-svg-wrapper svg .board-zone {
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
        .table-svg-wrapper
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
`;
