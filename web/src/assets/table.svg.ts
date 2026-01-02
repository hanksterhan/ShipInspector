import { svg } from "lit";

export const tableIcon = svg`
<svg
  class="poker-table-svg"
  viewBox="0 0 1200 600"
  preserveAspectRatio="xMidYMid meet"
  xmlns="http://www.w3.org/2000/svg"
  role="img"
  aria-label="Poker table background"
>
  <defs>
    <!-- Felt gradient -->
    <radialGradient id="feltGradient" cx="50%" cy="45%" r="65%">
      <stop offset="0%" stop-color="#2f7f57"/>
      <stop offset="100%" stop-color="#1f5f3f"/>
    </radialGradient>

    <!-- Rail gradient -->
    <linearGradient id="railGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3a2a1a"/>
      <stop offset="100%" stop-color="#1f140c"/>
    </linearGradient>

    <!-- Soft shadow -->
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Outer rail -->
  <rect
    class="table-rail"
    x="40"
    y="40"
    width="1120"
    height="520"
    rx="260"
    fill="url(#railGradient)"
    filter="url(#softShadow)"
  />

  <!-- Inner felt -->
  <rect
    class="table-felt"
    x="80"
    y="80"
    width="1040"
    height="440"
    rx="220"
    fill="url(#feltGradient)"
  />

  <!-- Optional board label -->
  <text
    class="board-label"
    x="600"
    y="400"
    text-anchor="middle"
    font-size="24"
    fill="rgba(255,255,255,0.4)"
    letter-spacing="1"
  >
    Ship Inspector Poker Club
  </text>
</svg>
`;
