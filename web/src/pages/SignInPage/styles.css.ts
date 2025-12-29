import { css } from "lit";

export const styles = css`
    :host {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background: #0f5132; /* Match main application green background */
        padding: 20px;
    }

    .sign-in-wrapper {
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
    }

    .sign-in-container {
        width: 100%;
        max-width: 420px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        padding: 40px 32px;
        box-sizing: border-box;
    }

    .loading-container,
    .error-container {
        text-align: center;
        padding: 40px 32px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        max-width: 420px;
        width: 100%;
    }

    .error-container h2 {
        color: #d32f2f;
        margin: 0 0 16px 0;
        font-size: 24px;
        font-weight: 600;
    }

    .error-container p {
        color: #666;
        margin: 0 0 24px 0;
        line-height: 1.5;
        font-size: 14px;
    }

    .error-container button {
        background: #1976d2;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 16px;
        font-weight: 500;
        transition: background 0.2s;
    }

    .error-container button:hover {
        background: #1565c0;
    }

    .loading-container p {
        color: #666;
        margin: 0;
        font-size: 16px;
    }

    /* Clerk component styling overrides */
    #clerk-sign-in {
        width: 100%;
    }

    /* Style Clerk root elements */
    :host ::slotted(.clerk-root-box),
    .clerk-root-box {
        background: transparent !important;
    }

    :host ::slotted(.clerk-card),
    .clerk-card {
        background: white !important;
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
    }
`;
