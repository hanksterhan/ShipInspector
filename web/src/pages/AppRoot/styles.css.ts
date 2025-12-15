import { css } from "lit";

export const styles = css`
    sp-theme {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: linear-gradient(
            135deg,
            #0f5132 0%,
            #157347 25%,
            #0f5132 50%,
            #157347 75%,
            #0f5132 100%
        );
        background-size: 200% 200%;
        animation: feltTexture 20s ease infinite;
        position: relative;
    }

    sp-theme::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image: repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(0, 0, 0, 0.03) 2px,
                rgba(0, 0, 0, 0.03) 4px
            ),
            repeating-linear-gradient(
                90deg,
                transparent,
                transparent 2px,
                rgba(0, 0, 0, 0.03) 2px,
                rgba(0, 0, 0, 0.03) 4px
            );
        pointer-events: none;
    }

    @keyframes feltTexture {
        0%,
        100% {
            background-position: 0% 50%;
        }
        50% {
            background-position: 100% 50%;
        }
    }
    .app-root-flex-container {
        display: flex;
        height: 100vh;
    }
    .app-root-content {
        flex: 1;
        overflow: auto;
        overflow-x: hidden;
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
