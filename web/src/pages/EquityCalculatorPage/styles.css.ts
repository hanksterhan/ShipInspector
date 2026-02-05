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
`;
