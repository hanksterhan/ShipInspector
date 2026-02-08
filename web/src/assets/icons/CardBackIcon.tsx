import type { SVGProps } from "react";

export function CardBackIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 88"
      fill="none"
      {...props}
    >
      <rect
        x="1"
        y="1"
        width="62"
        height="86"
        rx="5"
        stroke="currentColor"
        strokeWidth="2"
        fill="currentColor"
        fillOpacity="0.1"
      />
      <rect
        x="6"
        y="6"
        width="52"
        height="76"
        rx="3"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
      <path
        d="M32 20L38 32L32 44L26 32Z"
        fill="currentColor"
        fillOpacity="0.3"
      />
      <path
        d="M32 44L38 56L32 68L26 56Z"
        fill="currentColor"
        fillOpacity="0.3"
      />
    </svg>
  );
}
