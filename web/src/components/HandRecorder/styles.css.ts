import { css } from "lit";

export const styles = css`
    :host {
        display: block;
        width: 100%;
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

    .player-title {
        font-weight: 600;
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
    }
`;
