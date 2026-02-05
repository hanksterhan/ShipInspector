import { css } from "lit";

export const styles = css`
    :host {
        display: block;
        width: 100%;
        height: 100%;
    }

    .page-wrapper {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        padding: 24px;
        box-sizing: border-box;
    }

    .page-container {
        display: flex;
        flex-direction: column;
        flex: 1;
        gap: 24px;
    }

    .page-header {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .page-header h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 600;
        color: #1a1a1a;
    }

    .page-header p {
        margin: 0;
        font-size: 16px;
        color: #666;
    }

    .page-content {
        display: flex;
        flex-direction: column;
        flex: 1;
        gap: 16px;
    }

    .placeholder-content {
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 1;
        background: #f5f5f5;
        border-radius: 8px;
        padding: 48px;
    }

    .placeholder-content p {
        font-size: 18px;
        color: #4a4a4a;
        text-align: center;
    }
`;
