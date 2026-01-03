import { css } from "lit";

export const styles = css`
    :host {
        display: block;
    }

    /* Alert Dialog Overlay */
    .alert-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        animation: fadeIn 0.2s ease-in;
    }

    .alert-dialog-content {
        background: var(--spectrum-global-color-gray-50, white);
        border-radius: var(--spectrum-global-dimension-size-200);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        max-width: min(90vw, 500px);
        width: 100%;
        position: relative;
        animation: slideUp 0.3s ease-out;
        box-sizing: border-box;
    }

    /* Variant styles */
    .alert-dialog-content.alert-dialog-error {
        border: 1px solid var(--spectrum-global-color-red-500, #e34850);
    }

    .alert-dialog-content.alert-dialog-warning {
        border: 1px solid var(--spectrum-global-color-orange-500, #ff6e00);
    }

    .alert-dialog-content.alert-dialog-info {
        border: 1px solid var(--spectrum-global-color-blue-500, #2680eb);
    }

    .alert-dialog-header {
        padding: var(--spectrum-global-dimension-size-200);
        border-bottom: 1px solid var(--spectrum-global-color-gray-200, #e1e1e1);
        border-top-left-radius: var(--spectrum-global-dimension-size-200);
        border-top-right-radius: var(--spectrum-global-dimension-size-200);
    }

    .alert-dialog-content.alert-dialog-error .alert-dialog-header {
        background: var(--spectrum-global-color-red-50, #fff4f4);
    }

    .alert-dialog-content.alert-dialog-warning .alert-dialog-header {
        background: var(--spectrum-global-color-orange-50, #fff8f0);
    }

    .alert-dialog-content.alert-dialog-info .alert-dialog-header {
        background: var(--spectrum-global-color-blue-50, #f0f7ff);
    }

    .alert-dialog-header h2 {
        margin: 0;
        font-size: var(--spectrum-global-dimension-font-size-400);
        font-weight: var(--spectrum-global-font-weight-bold);
    }

    .alert-dialog-content.alert-dialog-error .alert-dialog-header h2 {
        color: var(--spectrum-global-color-red-700, #c81d25);
    }

    .alert-dialog-content.alert-dialog-warning .alert-dialog-header h2 {
        color: var(--spectrum-global-color-orange-700, #cc5500);
    }

    .alert-dialog-content.alert-dialog-info .alert-dialog-header h2 {
        color: var(--spectrum-global-color-blue-700, #1a5490);
    }

    .alert-dialog-body {
        padding: var(--spectrum-global-dimension-size-300);
        color: var(--spectrum-global-color-gray-800, #2c2c2c);
        font-size: var(--spectrum-global-dimension-font-size-200);
        line-height: 1.5;
    }

    .alert-dialog-footer {
        display: flex;
        justify-content: flex-end;
        padding: var(--spectrum-global-dimension-size-150);
        border-top: 1px solid var(--spectrum-global-color-gray-200, #e1e1e1);
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    @keyframes slideUp {
        from {
            transform: translateY(20px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
`;
