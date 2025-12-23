import { css } from "lit";

export const styles = css`
    :host {
        display: block;
        width: 100%;
    }

    .street-container {
        padding: var(--spectrum-global-dimension-size-300);
        background: white;
        border-radius: var(--spectrum-global-dimension-size-200);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        margin: var(--spectrum-global-dimension-size-200);
    }

    .street-selector {
        display: flex;
        gap: var(--spectrum-global-dimension-size-200);
        align-items: center;
        margin-bottom: var(--spectrum-global-dimension-size-200);
    }

    label {
        font-size: var(--spectrum-global-dimension-font-size-300);
        font-weight: var(--spectrum-global-font-weight-medium);
        color: var(--spectrum-global-color-gray-700);
    }

    select {
        padding: var(--spectrum-global-dimension-size-150);
        border: 1px solid var(--spectrum-global-color-gray-400);
        border-radius: var(--spectrum-global-dimension-size-100);
        font-size: var(--spectrum-global-dimension-font-size-300);
    }

    h4 {
        margin: var(--spectrum-global-dimension-size-200) 0
            var(--spectrum-global-dimension-size-100) 0;
        font-size: var(--spectrum-global-dimension-font-size-300);
        font-weight: var(--spectrum-global-font-weight-bold);
        color: var(--spectrum-global-color-gray-800);
    }

    .actions-list {
        display: flex;
        flex-direction: column;
        gap: var(--spectrum-global-dimension-size-100);
    }

    .action-item {
        padding: var(--spectrum-global-dimension-size-100)
            var(--spectrum-global-dimension-size-150);
        background: var(--spectrum-global-color-gray-50);
        border-radius: var(--spectrum-global-dimension-size-100);
        font-size: var(--spectrum-global-dimension-font-size-300);
        color: var(--spectrum-global-color-gray-700);
    }

    p {
        font-size: var(--spectrum-global-dimension-font-size-300);
        color: var(--spectrum-global-color-gray-600);
        font-style: italic;
    }
`;

