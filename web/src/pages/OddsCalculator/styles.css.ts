import { css } from "lit";

export const styles = css`
    :host {
        display: block;
        padding: 16px;
    }

    .odds-calculator-wrapper {
        display: flex;
        justify-content: center;
        width: 100%;
    }

    .odds-calculator-container {
        width: 100%;
        padding: 40px 32px;
        display: flex;
        flex-direction: column;
        gap: 24px;
    }

    .odds-calculator-content {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        width: 100%;
        padding-top: 10px;
        padding-bottom: 10px;
        gap: 24px;
    }
`;
