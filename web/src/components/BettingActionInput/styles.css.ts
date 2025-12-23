import { css } from "lit";

export const styles = css`
    :host {
        display: block;
        width: 100%;
    }

    .action-input-container {
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

    .action-form {
        display: flex;
        flex-direction: column;
        gap: var(--spectrum-global-dimension-size-200);
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

    select,
    input {
        padding: var(--spectrum-global-dimension-size-150);
        border: 1px solid var(--spectrum-global-color-gray-400);
        border-radius: var(--spectrum-global-dimension-size-100);
        font-size: var(--spectrum-global-dimension-font-size-300);
    }

    button {
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

    button:hover {
        background: var(--spectrum-global-color-blue-700);
    }
`;

