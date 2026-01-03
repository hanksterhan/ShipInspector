import { css } from "lit";

export const styles = css`
    :host {
        display: block;
        position: relative;
    }

    .start-button {
        padding: 12px 24px;
        background-color: #28a745;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 16px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .start-button:hover {
        background-color: #218838;
    }

    .start-button.active {
        background-color: #dc3545;
    }

    .start-button.active:hover {
        background-color: #c82333;
    }
`;
