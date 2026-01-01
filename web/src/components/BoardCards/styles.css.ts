import { css } from "lit";

export const styles = css`
    :host {
        display: block;
    }

    .board-cards-container {
        display: flex;
        gap: var(--spectrum-global-dimension-size-100);
        align-items: center;
        justify-content: center;
    }
`;
