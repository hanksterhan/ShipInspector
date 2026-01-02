import { css } from "lit";

export const styles = css`
    :host {
        display: block;
    }

    .save-button {
        padding: 12px 24px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 16px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .save-button:hover:not(:disabled) {
        background-color: #0056b3;
    }

    .save-button:disabled {
        background-color: #6c757d;
        cursor: not-allowed;
    }

    .error {
        color: #dc3545;
        margin-top: 8px;
        font-size: 14px;
    }

    .success {
        color: #28a745;
        margin-top: 8px;
        font-size: 14px;
    }
`;
