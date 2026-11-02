import type { Metadata } from "next";
import { Merriweather, Inter } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";

import { DEFAULT_SITE_TITLE, SITE_BRAND_NAME } from "@/lib/seo/metadata";

const merriweather = Merriweather({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "700", "900"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-editorial",
});

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-interface",
});

export const metadata: Metadata = {
  title: {
    default: DEFAULT_SITE_TITLE,
    template: `%s | ${SITE_BRAND_NAME}`,
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${merriweather.variable} ${inter.variable}`}
    >
      <body suppressHydrationWarning className="min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
