import { css } from "lit";

export const styles = css`
    :host {
        display: block;
    }

    .blind-controls-container {
        display: flex;
        flex-direction: column;
        gap: var(--spectrum-global-dimension-size-50);
        padding: var(--spectrum-global-dimension-size-150);
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid var(--spectrum-global-color-gray-300);
        border-radius: var(--spectrum-global-dimension-size-200);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(4px);
        min-width: 80px;
    }

    .blind-input-group {
        display: flex;
        flex-direction: row;
        align-items: center;
    }

    .blind-input-group sp-field-label {
        min-width: 100px;
        flex-shrink: 0;
    }

    .blind-input-group sp-textfield {
        width: 100px;
        flex-shrink: 0;
    }
`;
