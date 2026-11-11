import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import "./globals.css";
import { clashDisplay, montserrat } from "./fonts";
import { ThemeProvider } from "@/components/providers/theme-provider";

export const metadata: Metadata = {
  title: "Creative Cat",
  description:
    "Creative Cat - Expert in SEO, SSM, Web Dev, Design & content Your one-stop digital growth partner",
  icons: {
    icon: "/logos/Asset-4.svg",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full", "antialiased", montserrat.variable, clashDisplay.variable)}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
