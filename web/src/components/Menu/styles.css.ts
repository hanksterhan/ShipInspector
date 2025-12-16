import { css } from "lit";

export const styles = css`
    .header-bar {
        display: flex;
        flex-direction: column;
        align-items: center;
        background-color: var(--spectrum-gray-900);
        padding: 1rem 0.5rem;
        height: 100vh;
        width: 220px;
        position: relative;
        left: 0;
        top: 0;
        border-radius: 0 15px 15px 0;
        box-shadow: 0 2px 16px 0 rgba(0, 0, 0, 0.25);
        overflow: hidden;
        box-sizing: border-box;
        z-index: 100;
    }

    sp-button {
        margin: 3px 0;
        width: 90%;
        min-width: 0;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        font-size: 0.92rem;
        font-weight: 400;
        color: #bdbdbd;
        background: transparent;
        border-radius: 8px;
        padding: 0.35rem 0.5rem;
        transition:
            background 0.18s,
            color 0.18s,
            box-shadow 0.18s;
        gap: 0.7rem;
    }

    .menu-icon,
    .menu-icon svg {
        width: 20px;
        height: 20px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        vertical-align: middle;
        margin: 0;
        padding: 0;
    }

    sp-button:hover,
    sp-button.selected {
        background: rgba(100, 200, 100, 0.1);
        color: #b6fcb6;
        box-shadow: 0 0 8px 2px #3a5f3a;
    }

    .menu-item-container {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.7rem;
        width: 100%;
    }

    .menu-item-container h2 {
        font-size: 1rem;
        font-weight: 400;
        margin: 0;
        padding: 0;
        color: inherit;
        line-height: 1;
        display: flex;
        align-items: center;
    }

    .collapse-menu-btn {
        position: absolute;
        bottom: 16px;
        right: 12px;
        z-index: 10;
        background: white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        border-radius: 50%;
        padding: 6px;
    }

    .collapse-menu-icon {
        color: black;
        width: 24px;
        height: 24px;
    }

    .header-bar.collapsed {
        width: 56px;
        min-width: 40px;
        padding: 1rem 0.25rem;
        align-items: center;
        background: var(--spectrum-gray-900, #222);
        border-right: 2px solid #333;
    }
    .header-bar.collapsed .menu-item-container h2 {
        display: none;
    }
    .collapsed-menu-item {
        width: 40px;
        min-width: 40px;
        max-width: 40px;
        justify-content: center;
        padding: 0.5rem 0;
    }
`;
