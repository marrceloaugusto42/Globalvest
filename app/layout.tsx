import "./globals.css";
import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://globalvestcapital.site";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Globalvest Capital | Global Investing",
    template: "%s | Globalvest Capital",
  },
  description:
    "Explore global investment opportunities, manage your portfolio, and track your assets with Globalvest Capital.",
  applicationName: "Globalvest Capital",
  icons: { icon: "/icon.svg", shortcut: "/icon.svg" },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Globalvest Capital",
    title: "Globalvest Capital | Global Investing",
    description:
      "Explore global investment opportunities, manage your portfolio, and track your assets with Globalvest Capital.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Globalvest Capital | Global Investing",
    description:
      "Explore global investment opportunities, manage your portfolio, and track your assets with Globalvest Capital.",
  },
  robots: { index: true, follow: true },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
