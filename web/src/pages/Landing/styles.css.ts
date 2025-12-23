import { css } from "lit";

export const styles = css`
    :host {
        display: block;
        width: 100%;
        height: 100%;
    }

    sp-theme {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .landing-container {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: var(--spectrum-global-dimension-size-400);
    }

    .landing-card {
        background: white;
        border-radius: var(--spectrum-global-dimension-size-200);
        padding: var(--spectrum-global-dimension-size-600);
        width: 100%;
        max-width: 400px;
        box-shadow:
            0 4px 6px rgba(0, 0, 0, 0.1),
            0 1px 3px rgba(0, 0, 0, 0.08);
    }

    .landing-title {
        margin: 0 0 var(--spectrum-global-dimension-size-200) 0;
        font-size: var(--spectrum-global-dimension-font-size-900);
        font-weight: 700;
        text-align: center;
        color: var(--spectrum-global-color-gray-900);
    }

    .landing-subtitle {
        margin: 0 0 var(--spectrum-global-dimension-size-400) 0;
        text-align: center;
        color: var(--spectrum-global-color-gray-700);
        font-size: var(--spectrum-global-dimension-font-size-200);
    }

    .auth-form {
        display: flex;
        flex-direction: column;
        gap: var(--spectrum-global-dimension-size-300);
    }

    .auth-form sp-field-label {
        margin-bottom: var(--spectrum-global-dimension-size-100);
    }

    .submit-button {
        margin-top: var(--spectrum-global-dimension-size-200);
        width: 100%;
    }

    .toggle-mode {
        margin-top: var(--spectrum-global-dimension-size-400);
        text-align: center;
        color: var(--spectrum-global-color-gray-700);
        font-size: var(--spectrum-global-dimension-font-size-100);
    }

    .toggle-link {
        cursor: pointer;
    }

    .error-message {
        background-color: var(--spectrum-global-color-red-100);
        color: var(--spectrum-global-color-red-700);
        padding: var(--spectrum-global-dimension-size-200);
        border-radius: var(--spectrum-global-dimension-size-100);
        margin-bottom: var(--spectrum-global-dimension-size-300);
    }
`;
