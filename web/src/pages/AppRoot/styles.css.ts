import { css } from "lit";

export const styles = css`
    sp-theme {
        display: flex;
        flex-direction: column;
        height: 100%;
        background-color: #0f5132;
        position: relative;
    }

    sp-theme::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image: 
            repeating-linear-gradient(
                45deg,
                transparent,
                transparent 8px,
                rgba(0, 0, 0, 0.02) 8px,
                rgba(0, 0, 0, 0.02) 16px
            );
        pointer-events: none;
        opacity: 0.6;
        z-index: 0;
    }

    sp-theme::after {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: 
            radial-gradient(circle at 20% 30%, rgba(21, 115, 71, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(21, 115, 71, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(15, 81, 50, 0.1) 0%, transparent 50%);
        pointer-events: none;
        z-index: 0;
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
