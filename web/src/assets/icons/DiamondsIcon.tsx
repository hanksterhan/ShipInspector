import type { SVGProps } from "react";

export function DiamondsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      fill="currentColor"
      {...props}
    >
      <rect
        x="52.13"
        y="52.13"
        width="151.73"
        height="151.73"
        rx="7.95"
        transform="rotate(-45 128 128)"
      />
    </svg>
  );
}
