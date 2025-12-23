import { css } from "lit";

export const styles = css`
    .header-bar {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        background-color: var(--spectrum-gray-900);
        padding: 0.375rem 1rem;
        width: 100%;
        height: auto;
        box-shadow: 0 2px 16px 0 rgba(0, 0, 0, 0.25);
        overflow: hidden;
        box-sizing: border-box;
        z-index: 100;
        gap: 0.25rem;
    }

    .menu-items {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.25rem;
        flex: 1;
    }

    .action-buttons {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: var(--spectrum-global-dimension-size-100);
    }

    sp-button {
        margin: 0;
        min-width: 0;
        min-height: auto;
        height: auto;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        font-size: 0.85rem;
        font-weight: 400;
        color: #bdbdbd;
        background: transparent;
        border-radius: 6px;
        padding: 0.125rem 0.75rem;
        transition:
            background 0.18s,
            color 0.18s,
            box-shadow 0.18s;
        gap: 0.5rem;
        white-space: nowrap;
    }

    .menu-icon,
    .menu-icon svg {
        width: 16px;
        height: 16px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        vertical-align: middle;
        margin: 0;
        padding: 0;
    }

    sp-button:hover,
    sp-button.selected {
        background: rgba(139, 0, 0, 0.1);
        color: #ffb3b3;
        box-shadow: 0 0 8px 2px #5a0000;
    }

    .menu-item-container {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.5rem;
        width: 100%;
        line-height: 1;
        height: auto;
    }

    .menu-item-container h2 {
        font-size: 0.9rem;
        font-weight: 400;
        margin: 0;
        padding: 0;
        color: inherit;
        line-height: 1;
        display: flex;
        align-items: center;
        height: auto;
    }
`;
