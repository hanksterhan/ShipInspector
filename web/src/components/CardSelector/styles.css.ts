import { css } from "lit";

export const styles = css`
    :host {
        display: block;
        width: 100%;
    }

    .card-selector-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: var(--spectrum-global-dimension-size-300);
        gap: var(--spectrum-global-dimension-size-300);
    }

    .selection-stage {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--spectrum-global-dimension-size-300);
        width: 100%;
        max-width: 800px;
    }

    .stage-title {
        margin: 0;
        font-size: var(--spectrum-global-dimension-font-size-300);
        font-weight: var(--spectrum-global-font-weight-bold);
        color: var(--spectrum-global-color-gray-800);
    }

    .suit-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: var(--spectrum-global-dimension-size-200);
        width: 100%;
        max-width: 600px;
        justify-items: center;
    }

    sp-action-button.suit-button {
        width: 100px;
        height: 140px;
        min-width: 100px;
        max-width: 100px;
        min-height: 140px;
        max-height: 140px;
        aspect-ratio: 5 / 7;
        border-radius: var(--spectrum-global-dimension-size-100);
    }

    .suit-button-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--spectrum-global-dimension-size-100);
    }

    .suit-icon {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .suit-icon svg {
        width: 100%;
        height: 100%;
    }

    .selected-suit-indicator {
        display: flex;
        align-items: center;
        gap: var(--spectrum-global-dimension-size-100);
        padding: var(--spectrum-global-dimension-size-150);
        background-color: var(--spectrum-global-color-gray-100);
        border-radius: var(--spectrum-global-dimension-size-100);
        margin-bottom: var(--spectrum-global-dimension-size-200);
    }

    .selected-suit-icon {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .selected-suit-icon svg {
        width: 100%;
        height: 100%;
    }

    .selected-suit-label {
        font-size: var(--spectrum-global-dimension-font-size-200);
        font-weight: var(--spectrum-global-font-weight-bold);
        color: var(--spectrum-global-color-gray-800);
    }

    .rank-grid {
        display: flex;
        flex-direction: column;
        gap: var(--spectrum-global-dimension-size-200);
        width: 100%;
        max-width: 600px;
    }

    .rank-row {
        display: flex;
        gap: var(--spectrum-global-dimension-size-150);
        justify-content: center;
        align-items: center;
        flex-wrap: nowrap;
    }

    .rank-row:last-child {
        justify-content: center;
    }

    sp-action-button.rank-button {
        width: 60px;
        height: 84px;
        min-width: 60px;
        max-width: 60px;
        min-height: 84px;
        max-height: 84px;
        padding: var(--spectrum-global-dimension-size-75) !important;
        margin: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        aspect-ratio: 5 / 7;
        border-radius: var(--spectrum-global-dimension-size-100);
    }

    .rank-button-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--spectrum-global-dimension-size-50);
        width: 100%;
        height: 100%;
    }

    .rank-label {
        font-size: var(--spectrum-global-dimension-font-size-400);
        font-weight: var(--spectrum-global-font-weight-bold);
        line-height: 1;
    }

    .rank-suit-icon {
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .rank-suit-icon svg {
        width: 100%;
        height: 100%;
    }

    sp-action-button.back-button,
    sp-action-button.reset-button {
        margin-top: var(--spectrum-global-dimension-size-200);
    }

    .selected-card-display {
        width: 150px;
        height: 210px;
        min-width: 150px;
        max-width: 150px;
        min-height: 210px;
        max-height: 210px;
        aspect-ratio: 5 / 7;
        background: white;
        border-radius: var(--spectrum-global-dimension-size-150);
        border: 2px solid var(--spectrum-global-color-gray-400);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--spectrum-global-dimension-size-200);
        box-sizing: border-box;
    }

    .card-display-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--spectrum-global-dimension-size-100);
        width: 100%;
        height: 100%;
    }

    .card-rank {
        font-size: var(--spectrum-global-dimension-font-size-600);
        font-weight: var(--spectrum-global-font-weight-bold);
        color: var(--spectrum-global-color-gray-900);
        line-height: 1;
    }

    .card-suit-icon {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .card-suit-icon svg {
        width: 100%;
        height: 100%;
    }

    .selection-stage.complete {
        animation: fadeIn 0.3s ease-in;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @media (max-width: 600px) {
        .suit-grid {
            grid-template-columns: repeat(2, 1fr);
        }

        sp-action-button.rank-button {
            width: 50px;
            height: 70px;
            min-width: 50px;
            max-width: 50px;
            min-height: 70px;
            max-height: 70px;
        }

        .rank-suit-icon {
            width: 16px;
            height: 16px;
        }

        .rank-label {
            font-size: var(--spectrum-global-dimension-font-size-300);
        }

        sp-action-button.suit-button {
            width: 80px;
            height: 112px;
            min-width: 80px;
            max-width: 80px;
            min-height: 112px;
            max-height: 112px;
        }

        .suit-icon {
            width: 40px;
            height: 40px;
        }
    }
`;
