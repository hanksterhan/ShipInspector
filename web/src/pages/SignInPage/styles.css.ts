import { css } from "lit";

export const styles = css`
    :host {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background: var(--background-color, #f5f5f5);
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
        max-width: 480px;
        padding: 20px;
    }

    .loading-container,
    .error-container {
        text-align: center;
        padding: 40px 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        max-width: 400px;
    }

    .error-container h2 {
        color: #d32f2f;
        margin: 0 0 16px 0;
        font-size: 24px;
    }

    .error-container p {
        color: #666;
        margin: 0 0 24px 0;
        line-height: 1.5;
    }

    .error-container button {
        background: #1976d2;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
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
`;
