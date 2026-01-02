import { css } from "lit";

export const styles = css`
    :host {
        display: block;
    }

    /* Player Name Edit Modal */
    .name-edit-modal-overlay {
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

    .name-edit-modal-content {
        background: white;
        border-radius: var(--spectrum-global-dimension-size-200);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        max-width: min(90vw, 500px);
        width: 100%;
        position: relative;
        animation: slideUp 0.3s ease-out;
        box-sizing: border-box;
    }

    .name-edit-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spectrum-global-dimension-size-300);
        border-bottom: 1px solid var(--spectrum-global-color-gray-200);
    }

    .name-edit-modal-header h3 {
        margin: 0;
        font-size: var(--spectrum-global-dimension-font-size-400);
        font-weight: var(--spectrum-global-font-weight-bold);
        color: var(--spectrum-global-color-gray-800);
    }

    .name-edit-modal-body {
        padding: var(--spectrum-global-dimension-size-300);
    }

    .name-edit-modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: var(--spectrum-global-dimension-size-150);
        padding: var(--spectrum-global-dimension-size-300);
        border-top: 1px solid var(--spectrum-global-color-gray-200);
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
