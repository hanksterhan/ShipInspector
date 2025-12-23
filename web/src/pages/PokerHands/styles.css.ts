import { css } from "lit";

export const styles = css`
    :host {
        display: block;
        padding: var(--spectrum-global-dimension-size-300);
    }

    .poker-hands-container {
        max-width: 1200px;
        margin: 0 auto;
    }

    h1 {
        margin: 0 0 var(--spectrum-global-dimension-size-300) 0;
        font-size: var(--spectrum-global-dimension-font-size-500);
        font-weight: var(--spectrum-global-font-weight-bold);
        color: var(--spectrum-global-color-gray-800);
    }

    .error-message {
        padding: var(--spectrum-global-dimension-size-200);
        background: var(--spectrum-global-color-red-100);
        color: var(--spectrum-global-color-red-800);
        border-radius: var(--spectrum-global-dimension-size-100);
        margin-bottom: var(--spectrum-global-dimension-size-200);
    }

    .replay-content {
        display: flex;
        flex-direction: column;
        gap: var(--spectrum-global-dimension-size-200);
    }

    .actions-bar {
        display: flex;
        gap: var(--spectrum-global-dimension-size-200);
        padding: var(--spectrum-global-dimension-size-200);
        justify-content: flex-end;
    }

    .actions-bar button {
        padding: var(--spectrum-global-dimension-size-200)
            var(--spectrum-global-dimension-size-300);
        background: var(--spectrum-global-color-blue-600);
        color: white;
        border: none;
        border-radius: var(--spectrum-global-dimension-size-100);
        font-size: var(--spectrum-global-dimension-font-size-300);
        font-weight: var(--spectrum-global-font-weight-medium);
        cursor: pointer;
    }

    .actions-bar button:hover:not(:disabled) {
        background: var(--spectrum-global-color-blue-700);
    }

    .actions-bar button:disabled {
        background: var(--spectrum-global-color-gray-400);
        cursor: not-allowed;
    }
`;
