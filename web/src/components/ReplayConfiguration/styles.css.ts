import { css } from "lit";

export const styles = css`
    :host {
        display: block;
        width: 100%;
    }

    .config-container {
        padding: var(--spectrum-global-dimension-size-300);
        background: white;
        border-radius: var(--spectrum-global-dimension-size-200);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        margin: var(--spectrum-global-dimension-size-200);
    }

    h3 {
        margin: 0 0 var(--spectrum-global-dimension-size-200) 0;
        font-size: var(--spectrum-global-dimension-font-size-400);
        font-weight: var(--spectrum-global-font-weight-bold);
        color: var(--spectrum-global-color-gray-800);
    }

    .config-form {
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

    .config-info {
        display: flex;
        flex-direction: column;
        gap: var(--spectrum-global-dimension-size-100);
        margin-bottom: var(--spectrum-global-dimension-size-200);
    }

    .config-info div {
        font-size: var(--spectrum-global-dimension-font-size-300);
        color: var(--spectrum-global-color-gray-700);
    }

    .button-position-selector {
        display: flex;
        gap: var(--spectrum-global-dimension-size-100);
        align-items: center;
    }

    .button-position-selector label {
        font-size: var(--spectrum-global-dimension-font-size-300);
        font-weight: var(--spectrum-global-font-weight-medium);
        color: var(--spectrum-global-color-gray-700);
    }

    .button-position-selector select {
        padding: var(--spectrum-global-dimension-size-100)
            var(--spectrum-global-dimension-size-150);
        border: 1px solid var(--spectrum-global-color-gray-400);
        border-radius: var(--spectrum-global-dimension-size-100);
        font-size: var(--spectrum-global-dimension-font-size-300);
    }

    .table-size-slider {
        width: 100%;
    }
`;

