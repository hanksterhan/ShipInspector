import { css } from "lit";

export const styles = css`
    :host {
        display: block;
        width: 100%;
        height: 100vh;
    }

    .signin-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 20px;
    }

    .signin-card {
        background: white;
        border-radius: 16px;
        padding: 48px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        max-width: 450px;
        width: 100%;
    }

    .signin-title {
        text-align: center;
        margin: 0 0 8px 0;
        font-size: 32px;
        font-weight: 600;
        color: #1a1a1a;
    }

    .signin-subtitle {
        text-align: center;
        margin: 0 0 24px 0;
        font-size: 14px;
        color: #666;
    }

    .error-message {
        background: #fef2f2;
        border: 1px solid #fecaca;
        color: #dc2626;
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 16px;
        font-size: 14px;
        text-align: center;
    }

    .clerk-mount-point {
        min-height: 400px;
    }

    /* Clerk styling customization */
    :host ::part(clerk-root-box) {
        width: 100%;
    }

    :host ::part(clerk-card) {
        box-shadow: none;
        border: none;
    }
`;

