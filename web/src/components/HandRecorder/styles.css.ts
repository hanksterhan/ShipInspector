import { css } from "lit";

export const styles = css`
    :host {
        display: block;
        width: 100%;
        scroll-behavior: smooth;
    }

    .hand-recorder {
        width: 100%;
        max-width: 960px;
        padding: 24px;
        background: rgba(20, 20, 20, 0.2);
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        flex-direction: column;
        gap: 24px;
    }

    .section-header {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .section-header h3 {
        margin: 0;
        font-size: 22px;
    }

    .section-subtitle {
        font-size: 14px;
        opacity: 0.8;
    }

    .toast {
        padding: 12px 16px;
        border-radius: 12px;
        font-size: 13px;
        font-weight: 600;
    }

    .toast.success {
        background: rgba(20, 120, 20, 0.2);
        border: 1px solid rgba(20, 120, 20, 0.5);
    }

    .toast.error {
        background: rgba(180, 20, 20, 0.2);
        border: 1px solid rgba(180, 20, 20, 0.5);
    }

    .form-grid {
        display: grid;
        gap: 20px;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    }

    .form-section {
        padding: 16px;
        border-radius: 14px;
        background: rgba(0, 0, 0, 0.25);
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .form-section h4 {
        margin: 0;
        font-size: 16px;
    }

    .field {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .players-section {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .players-header {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .players-subtitle {
        font-size: 13px;
        opacity: 0.8;
    }

    .players-grid {
        display: grid;
        gap: 16px;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    }

    .player-card {
        padding: 14px;
        border-radius: 14px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(0, 0, 0, 0.25);
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .player-card.inactive {
        opacity: 0.7;
    }

    .player-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 600;
    }

    .player-toggle {
        min-height: 32px;
    }

    .player-inactive {
        font-size: 13px;
        opacity: 0.7;
    }

    .player-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }

    .hero-toggle {
        min-height: 32px;
    }

    .hole-cards {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    }

    .hole-card {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .card-slot {
        min-height: 44px;
        justify-content: center;
        font-weight: 600;
    }

    .card-slot.filled {
        outline: 2px solid rgba(38, 128, 235, 0.7);
        outline-offset: 2px;
    }

    .clear-card {
        min-height: 32px;
    }

    .board-section {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .board-row {
        display: grid;
        grid-template-columns: 80px 1fr;
        gap: 12px;
        align-items: center;
    }

    .board-label {
        font-size: 13px;
        font-weight: 600;
    }

    .board-cards {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
    }

    .board-slot {
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 140px;
    }

    .field-errors {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 12px;
        color: #d32f2f;
    }

    .footer-actions {
        display: flex;
        justify-content: flex-end;
    }

    sp-number-field,
    sp-picker,
    sp-textfield,
    sp-button,
    sp-action-button {
        min-height: 44px;
    }

    @media (max-width: 720px) {
        .hand-recorder {
            padding: 16px;
        }

        .board-row {
            grid-template-columns: 1fr;
        }
    }
`;
