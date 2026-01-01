import { css } from "lit";

export const styles = css`
    :host {
        display: block;
        padding: 16px;
    }

    .poker-hands-wrapper {
        display: flex;
        justify-content: center;
        width: 100%;
    }

    .poker-hands-container {
        width: 100%;
        padding: 40px 32px;
        display: flex;
        flex-direction: column;
        gap: 24px;
    }

    .poker-hands-content {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        width: 100%;
        padding-top: 10px;
        padding-bottom: 10px;
        gap: 24px;
    }

    .outs-display-container {
        display: flex;
        justify-content: center;
        width: 100%;
        padding: 0 32px;
    }

    .player-hands-section {
        display: flex;
        justify-content: center;
    }

    .board-section {
        display: flex;
        justify-content: center;
        position: relative;
    }

    .equity-section {
        display: flex;
        justify-content: center;
    }
`;
