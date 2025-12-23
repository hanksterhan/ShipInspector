import { css } from "lit";

export const styles = css`
    sp-theme {
        display: flex;
        flex-direction: column;
        height: 100%;
        background-color: #0f5132;
    }

    .app-root-flex-container {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        position: relative;
    }
    .app-root-content {
        flex: 1;
        overflow-x: hidden;
        position: relative;
        z-index: 1;
    }
    .expand-menu-btn {
        position: fixed;
        bottom: 24px;
        left: 24px;
        z-index: 1000;
        background: white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        border-radius: 50%;
        padding: 6px;
    }
    .expand-menu-icon {
        color: black;
        width: 24px;
        height: 24px;
    }

    .settings-toggle-button {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 1000;
        background: white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        border-radius: 50%;
        width: 48px;
        height: 48px;
        padding: 0;
    }

    .settings-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        color: var(--spectrum-global-color-gray-700);
    }

    .settings-toggle-button:hover .settings-icon {
        color: var(--spectrum-global-color-gray-900);
    }

    .settings-card {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 100;
        padding: var(--spectrum-global-dimension-size-300);
        background: transparent;
        display: flex;
        justify-content: center;
        align-items: flex-end;
        pointer-events: none;
    }

    .settings-card poker-options {
        pointer-events: all;
        width: 100%;
        max-width: 600px;
    }

    .loading-container {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
    }
`;
