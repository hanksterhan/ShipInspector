import { css } from "lit";

export const styles = css`
    :host {
        display: block;
        width: 100%;
    }

    .action-recorder {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 16px;
        border: 1px solid #e0e0e0;
        border-radius: 12px;
        background: #ffffff;
        width: 100%;
        max-width: 980px;
    }

    .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
    }

    .section-header h3 {
        margin: 0;
        font-size: 18px;
    }

    .edit-badge {
        background: #f5f0ff;
        color: #5b2c9d;
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 12px;
    }

    .street-selector sp-action-group,
    .player-selector sp-action-group {
        flex-wrap: wrap;
        gap: 8px;
    }

    .board-selector {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .board-slots {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }

    .board-slot {
        min-width: 70px;
        min-height: 44px;
        justify-content: center;
        font-weight: 600;
    }

    .board-slot.selected {
        outline: 2px solid #2680eb;
        outline-offset: 2px;
    }

    .board-hint {
        font-size: 12px;
        color: #6b6b6b;
    }

    .player-selector {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .empty-state {
        font-size: 12px;
        color: #5a5a5a;
    }

    .amount-row {
        display: grid;
        grid-template-columns: auto 1fr auto 1fr;
        gap: 8px;
        align-items: center;
    }

    .amount-row input {
        min-height: 40px;
        border-radius: 8px;
        border: 1px solid #d0d0d0;
        padding: 0 10px;
        font-size: 14px;
    }

    .amount-label {
        font-size: 12px;
        color: #5a5a5a;
    }

    .action-buttons {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 10px;
    }

    .action-button {
        min-height: 48px;
        font-size: 14px;
    }

    .error-message {
        color: #c9252d;
        font-size: 13px;
    }

    .edit-actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
    }

    .save-button {
        background: #1473e6;
        color: #ffffff;
    }

    .cancel-button {
        background: #f0f0f0;
    }

    .action-history h4 {
        margin: 0 0 8px;
        font-size: 16px;
    }

    .history-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .history-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 10px 12px;
        border: 1px solid #e4e4e4;
        border-radius: 10px;
        background: #fafafa;
        gap: 12px;
    }

    .history-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }

    .history-main {
        display: flex;
        gap: 12px;
        flex: 1;
    }

    .history-index {
        font-weight: 700;
        color: #5a5a5a;
    }

    .history-details {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .history-line {
        font-size: 13px;
    }

    .history-amount {
        color: #6b6b6b;
    }

    .edit-button {
        min-height: 36px;
    }

    .remove-button {
        min-height: 36px;
        background: #f5f5f5;
    }

    .history-empty {
        font-size: 13px;
        color: #7a7a7a;
    }

    @media (max-width: 720px) {
        .amount-row {
            grid-template-columns: 1fr;
        }

        .amount-label {
            margin-top: 8px;
        }

        .action-buttons {
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        }
    }
`;
