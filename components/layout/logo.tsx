import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
};

/**
 * Inline wordmark so the type and the mark follow the theme through
 * `currentColor` instead of shipping separate light/dark SVG files.
 *
 * Geometry and metrics come from public/logos/Asset-1.svg; the white fill is
 * mapped to currentColor and the two accent marks keep brand coral.
 */
export function Logo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 1110.89 336.8"
      role="img"
      aria-label="Creative Cat"
      className={cn("block h-8 w-auto md:h-9 lg:h-10", className)}
    >
      <g fill="currentColor">
        <path d="M934.09,80.29c-10.51,2.66-20.36,6.96-29.27,12.62-4.04-28.35-28.4-50.12-57.88-50.12-32.32,0-58.54,26.17-58.54,58.5s26.21,58.49,58.54,58.49c4.42,0,8.75-.5,12.91-1.43-1.28,6.43-1.96,13.09-1.96,19.9,0,4.02.24,7.98.69,11.87-3.81.51-7.7.77-11.64.77-49.53,0-89.65-40.13-89.65-89.61s40.12-89.66,89.65-89.66c42.27,0,77.7,29.29,87.15,68.66Z" />
        <path d="M958.91,88.62c-49.49,0-89.61,40.12-89.61,89.65s40.12,89.61,89.61,89.61h46.86v-31.11h-46.86c-32.31,0-58.49-26.2-58.49-58.51s26.2-58.51,58.51-58.51,58.51,26.2,58.51,58.51c0,0,0,0,0,0h.02v89.61h31.11v-89.93h0c-.17-49.39-40.22-89.34-89.65-89.34Z" />
        <polygon points="1091.31 87.76 1091.31 48.59 1060.2 48.59 1060.2 87.76 1052.3 87.76 1052.3 118.87 1060.2 118.87 1060.2 267.89 1091.31 267.89 1091.31 118.87 1110.89 118.87 1110.89 87.76 1091.31 87.76" />
        <text
          transform="translate(0 256.33)"
          className="font-sans"
          fontSize="176.09"
          fontWeight="300"
        >
          <tspan x="0" y="0">
            Creative
          </tspan>
        </text>
      </g>
      <g className="fill-brand-coral">
        <polygon points="927.25 41.83 944.95 41.83 944.95 17.71 944.95 0 927.25 0 903.13 0 903.13 17.71 927.25 17.71 927.25 41.83" />
        <polygon points="768.91 17.71 793.04 17.71 793.04 0 768.91 0 751.21 0 751.21 17.71 751.21 41.83 768.91 41.83 768.91 17.71" />
      </g>
    </svg>
  );
}
