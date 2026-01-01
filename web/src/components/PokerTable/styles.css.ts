import { css } from "lit";

export const styles = css`
    :host {
        display: block;
        width: 100%;
    }

    /* Table SVG Container */
    .table-svg-container {
        position: relative;
        width: 100%;
        max-width: 1200px;
        min-width: 400px;
        margin: 0 auto;
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

    /* Board cards wrapper - centered in the middle of the table */
    .board-cards-wrapper {
        position: absolute;
        top: 48%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 15;
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
`;
