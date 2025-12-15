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
        height: 100vh;
        position: relative;
        z-index: 1;
    }
    .app-root-content {
        flex: 1;
        overflow: auto;
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
`;
