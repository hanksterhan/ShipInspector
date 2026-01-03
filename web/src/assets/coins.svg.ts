import { svg } from "lit";

export const coinsIcon = svg`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <rect width="256" height="256" fill="none"/>

  <!-- Top coin -->
  <ellipse cx="128" cy="72" rx="88" ry="32"
    fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
  <path d="M40,72v20c0,17.67,39.4,32,88,32s88-14.33,88-32V72"
    fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>

  <!-- Middle coin -->
  <path d="M40,112v20c0,17.67,39.4,32,88,32s88-14.33,88-32V112"
    fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>

  <!-- Bottom coin -->
  <path d="M40,152v20c0,17.67,39.4,32,88,32s88-14.33,88-32V152"
    fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>

  <!-- Small vertical details (echoing your reference icon) -->
  <line x1="88" y1="100" x2="88" y2="196"
    fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
  <line x1="168" y1="92" x2="168" y2="188"
    fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
  <line x1="128" y1="112" x2="128" y2="212"
    fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
</svg>
`;
