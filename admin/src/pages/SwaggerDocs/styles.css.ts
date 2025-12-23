import { css } from "lit";

export const styles = css`
    :host {
        display: block;
        padding: 24px;
        height: 90vh;
        box-sizing: border-box;
        overflow: hidden;
    }

    .swagger-docs-container {
        width: 100%;
        height: 100%;
        overflow: hidden;
    }

    .swagger-iframe {
        width: 100%;
        height: 100%;
        border: none;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        background: white;
        display: block;
    }
`;
