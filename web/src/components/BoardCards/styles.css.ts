import { css } from "lit";

export const styles = css`
    :host {
        display: block;
    }

    .board-cards-container {
        display: flex;
        gap: var(--spectrum-global-dimension-size-100);
        align-items: center;
        justify-content: center;
    }

    /* Responsive gap adjustments for smaller viewports */
    @media (max-width: 900px) {
        .board-cards-container {
            gap: var(--spectrum-global-dimension-size-75);
        }
    }

    @media (max-width: 600px) {
        .board-cards-container {
            gap: var(--spectrum-global-dimension-size-50);
        }
    }

    @media (max-width: 400px) {
        .board-cards-container {
            gap: var(--spectrum-global-dimension-size-50);
        }
    }
`;
