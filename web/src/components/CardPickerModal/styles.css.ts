import { css } from "lit";

export const styles = css`
    :host {
        display: block;
    }

    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    .modal-content {
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        max-width: 90vw;
        max-height: 90vh;
        width: 600px;
        display: flex;
        flex-direction: column;
        animation: slideUp 0.2s ease-out;
        outline: none;
    }

    @keyframes slideUp {
        from {
            transform: translateY(20px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid #e0e0e0;
    }

    .modal-title {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
    }

    .close-button {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #666;
        transition: color 0.2s;
    }

    .close-button:hover {
        color: #000;
    }

    .close-button svg {
        width: 20px;
        height: 20px;
    }

    .modal-body {
        padding: 20px;
        overflow-y: auto;
        flex: 1;
    }

    .card-grid {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .suit-row {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .suit-label {
        min-width: 80px;
        font-weight: 500;
        font-size: 14px;
        color: #666;
    }

    .rank-row {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        flex: 1;
    }

    .card-button {
        width: 50px;
        height: 70px;
        border: 2px solid #ddd;
        border-radius: 6px;
        background: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        padding: 0;
    }

    .card-button:hover:not(.disabled) {
        border-color: #007bff;
        transform: translateY(-2px);
        box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
    }

    .card-button.highlighted:not(.disabled) {
        border-color: #007bff;
        background-color: #f0f7ff;
    }

    .card-button.disabled {
        opacity: 0.4;
        cursor: not-allowed;
        background-color: #f5f5f5;
    }

    .card-button-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
    }

    .card-rank {
        font-size: 16px;
        font-weight: 600;
    }

    .card-suit-icon {
        font-size: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .card-suit-icon svg {
        width: 20px;
        height: 20px;
    }

    .modal-footer {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 12px;
        padding: 16px 20px;
        border-top: 1px solid #e0e0e0;
    }

    .action-button {
        padding: 8px 16px;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: white;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s;
    }

    .action-button:hover {
        background-color: #f5f5f5;
    }

    .done-button {
        background-color: #007bff;
        color: white;
        border-color: #007bff;
    }

    .done-button:hover {
        background-color: #0056b3;
        border-color: #0056b3;
    }

    .reset-button {
        color: #dc3545;
        border-color: #dc3545;
    }

    .reset-button:hover {
        background-color: #dc3545;
        color: white;
    }
`;
