import { css } from "lit";

export const styles = css`
    :host {
        display: block;
    }

    .board-cards-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--spectrum-global-dimension-size-150);
    }

    .board-cards-container {
        display: flex;
        gap: var(--spectrum-global-dimension-size-100);
        align-items: center;
        justify-content: center;
    }

    .winning-hand-name {
        font-size: var(--spectrum-global-dimension-font-size-300);
        font-weight: var(--spectrum-global-font-weight-bold);
        color: var(--spectrum-global-color-gray-900);
        text-align: center;
        padding: var(--spectrum-global-dimension-size-150)
            var(--spectrum-global-dimension-size-300);
        background: rgba(255, 255, 255, 0.95);
        border-radius: var(--spectrum-global-dimension-size-200);
        border: 2px solid var(--spectrum-global-color-gray-300);
        box-shadow:
            0 4px 12px rgba(0, 0, 0, 0.15),
            0 2px 4px rgba(0, 0, 0, 0.1);
        letter-spacing: 0.025em;
        line-height: 1.4;
        backdrop-filter: blur(8px);
        transition: all 0.3s ease;
    }

    /* Responsive gap adjustments for smaller viewports */
    @media (max-width: 900px) {
        .board-cards-container {
            gap: var(--spectrum-global-dimension-size-75);
        }

        .board-cards-wrapper {
            gap: var(--spectrum-global-dimension-size-100);
        }
    }

    @media (max-width: 600px) {
        .board-cards-container {
            gap: var(--spectrum-global-dimension-size-50);
        }

        .board-cards-wrapper {
            gap: var(--spectrum-global-dimension-size-75);
        }

        .winning-hand-name {
            font-size: var(--spectrum-global-dimension-font-size-200);
            padding: var(--spectrum-global-dimension-size-100)
                var(--spectrum-global-dimension-size-200);
        }
    }

    @media (max-width: 400px) {
        .board-cards-container {
            gap: var(--spectrum-global-dimension-size-50);
        }

        .winning-hand-name {
            font-size: var(--spectrum-global-dimension-font-size-175);
            padding: var(--spectrum-global-dimension-size-75)
                var(--spectrum-global-dimension-size-150);
        }
    }
`;
