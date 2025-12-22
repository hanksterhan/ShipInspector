import { css } from "lit";

export const styles = css`
    :host {
        display: block;
        width: 100%;
    }

    .player-management-container {
        padding: var(--spectrum-global-dimension-size-300);
        background: white;
        border-radius: var(--spectrum-global-dimension-size-200);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        margin: var(--spectrum-global-dimension-size-200);
    }

    h4 {
        margin: 0 0 var(--spectrum-global-dimension-size-200) 0;
        font-size: var(--spectrum-global-dimension-font-size-300);
        font-weight: var(--spectrum-global-font-weight-bold);
        color: var(--spectrum-global-color-gray-800);
    }

    h5 {
        margin: var(--spectrum-global-dimension-size-200) 0
            var(--spectrum-global-dimension-size-100) 0;
        font-size: var(--spectrum-global-dimension-font-size-300);
        font-weight: var(--spectrum-global-font-weight-bold);
        color: var(--spectrum-global-color-gray-700);
    }

    .players-list {
        display: flex;
        flex-direction: column;
        gap: var(--spectrum-global-dimension-size-100);
        margin-bottom: var(--spectrum-global-dimension-size-200);
    }

    .player-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spectrum-global-dimension-size-150);
        background: var(--spectrum-global-color-gray-50);
        border-radius: var(--spectrum-global-dimension-size-100);
        border: 1px solid var(--spectrum-global-color-gray-300);
    }

    .player-info {
        display: flex;
        flex-direction: column;
        gap: var(--spectrum-global-dimension-size-50);
        flex: 1;
    }

    .player-info strong {
        font-size: var(--spectrum-global-dimension-font-size-300);
        color: var(--spectrum-global-color-gray-800);
    }

    .player-name {
        font-size: var(--spectrum-global-dimension-font-size-200);
        color: var(--spectrum-global-color-gray-600);
        font-style: italic;
    }

    .player-details {
        font-size: var(--spectrum-global-dimension-font-size-200);
        color: var(--spectrum-global-color-gray-600);
    }

    .player-actions {
        display: flex;
        gap: var(--spectrum-global-dimension-size-100);
    }

    .player-actions button {
        padding: var(--spectrum-global-dimension-size-100)
            var(--spectrum-global-dimension-size-150);
        border: none;
        border-radius: var(--spectrum-global-dimension-size-100);
        font-size: var(--spectrum-global-dimension-font-size-200);
        font-weight: var(--spectrum-global-font-weight-medium);
        cursor: pointer;
    }

    .player-actions button.active {
        background: var(--spectrum-global-color-green-600);
        color: white;
    }

    .player-actions button.inactive {
        background: var(--spectrum-global-color-gray-400);
        color: white;
    }

    .player-actions button.remove {
        background: var(--spectrum-global-color-red-600);
        color: white;
    }

    .player-actions button:hover {
        opacity: 0.8;
    }

    .add-player-form {
        display: flex;
        flex-direction: column;
        gap: var(--spectrum-global-dimension-size-150);
        padding-top: var(--spectrum-global-dimension-size-200);
        border-top: 1px solid var(--spectrum-global-color-gray-300);
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: var(--spectrum-global-dimension-size-75);
    }

    label {
        font-size: var(--spectrum-global-dimension-font-size-300);
        font-weight: var(--spectrum-global-font-weight-medium);
        color: var(--spectrum-global-color-gray-700);
    }

    input {
        padding: var(--spectrum-global-dimension-size-150);
        border: 1px solid var(--spectrum-global-color-gray-400);
        border-radius: var(--spectrum-global-dimension-size-100);
        font-size: var(--spectrum-global-dimension-font-size-300);
    }

    .add-player-form button {
        padding: var(--spectrum-global-dimension-size-200)
            var(--spectrum-global-dimension-size-300);
        background: var(--spectrum-global-color-blue-600);
        color: white;
        border: none;
        border-radius: var(--spectrum-global-dimension-size-100);
        font-size: var(--spectrum-global-dimension-font-size-300);
        font-weight: var(--spectrum-global-font-weight-medium);
        cursor: pointer;
        margin-top: var(--spectrum-global-dimension-size-100);
    }

    .add-player-form button:hover {
        background: var(--spectrum-global-color-blue-700);
    }

    .no-players,
    .max-players {
        font-size: var(--spectrum-global-dimension-font-size-300);
        color: var(--spectrum-global-color-gray-600);
        font-style: italic;
        text-align: center;
        padding: var(--spectrum-global-dimension-size-200);
    }
`;

