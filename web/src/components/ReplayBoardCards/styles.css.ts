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
        padding: var(--spectrum-global-dimension-size-200);
        background: rgba(0, 100, 0, 0.3);
        border-radius: var(--spectrum-global-dimension-size-150);
    }

    .board-card,
    .board-card-placeholder {
        width: 60px;
        height: 84px;
        border-radius: var(--spectrum-global-dimension-size-100);
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        transition: all 0.3s ease;
    }

    .board-card {
        background: white;
        border: 2px solid var(--spectrum-global-color-gray-400);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .board-card-placeholder {
        background: rgba(255, 255, 255, 0.1);
        border: 2px dashed rgba(255, 255, 255, 0.3);
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

    /* Responsive scaling */
    @media (max-width: 600px) {
        .board-card,
        .board-card-placeholder {
            width: 48px;
            height: 67px;
        }

        .card-rank {
            font-size: var(--spectrum-global-dimension-font-size-300);
        }

        .card-suit-icon {
            width: 18px;
            height: 18px;
        }
    }
`;
