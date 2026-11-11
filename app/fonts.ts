import { Montserrat } from "next/font/google";
import localFont from "next/font/local";

export const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

/**
 * Clash Display is self-hosted. The variable file covers the 200-700 weight
 * range, so `font-heading` can use a single file for hero and section titles.
 *
 * `adjustFontFallback` is intentionally omitted: Next 16.4.5 generates metric
 * overrides from the font's own metadata by default, and passing anything
 * (including `false`) changes preload behavior.
 */
export const clashDisplay = localFont({
  src: [
    {
      path: "./fonts/ClashDisplay-Variable.woff2",
      weight: "200 700",
      style: "normal",
    },
  ],
  variable: "--font-clash",
  display: "swap",
  preload: true,
});
