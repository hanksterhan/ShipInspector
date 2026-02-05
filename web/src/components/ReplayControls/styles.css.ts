import { css } from "lit";

export const styles = css`
    :host {
        display: block;
    }

    .replay-controls {
        display: flex;
        flex-direction: column;
        gap: var(--spectrum-global-dimension-size-200);
        padding: var(--spectrum-global-dimension-size-200);
        background: var(--spectrum-global-color-gray-100);
        border-radius: var(--spectrum-global-dimension-size-150);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    /* Timeline */
    .timeline-container {
        display: flex;
        flex-direction: column;
        gap: var(--spectrum-global-dimension-size-75);
    }

    .timeline {
        height: 8px;
        background: var(--spectrum-global-color-gray-300);
        border-radius: 4px;
        cursor: pointer;
        position: relative;
        overflow: visible;
    }

    .timeline-progress {
        height: 100%;
        background: var(--spectrum-global-color-blue-500);
        border-radius: 4px;
        transition: width 0.1s ease;
    }

    .timeline-thumb {
        position: absolute;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 16px;
        height: 16px;
        background: var(--spectrum-global-color-blue-600);
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        transition: left 0.1s ease;
    }

    .timeline:hover .timeline-thumb {
        transform: translate(-50%, -50%) scale(1.2);
    }

    .timeline-labels {
        display: flex;
        justify-content: center;
        font-size: var(--spectrum-global-dimension-font-size-100);
        color: var(--spectrum-global-color-gray-700);
    }

    /* Street Buttons */
    .street-buttons {
        display: flex;
        justify-content: center;
    }

    /* Playback Controls */
    .playback-controls {
        display: flex;
        justify-content: center;
    }

    /* Speed Controls */
    .speed-controls {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--spectrum-global-dimension-size-100);
    }

    .speed-label {
        font-size: var(--spectrum-global-dimension-font-size-100);
        color: var(--spectrum-global-color-gray-700);
    }

    /* Responsive */
    @media (max-width: 600px) {
        .replay-controls {
            padding: var(--spectrum-global-dimension-size-150);
            gap: var(--spectrum-global-dimension-size-150);
        }
    }
`;
