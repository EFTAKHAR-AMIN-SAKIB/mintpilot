import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MintPilot — Natural-Language NFT Minting on BNB Smart Chain",
  description:
    "Your intent. Your wallet. Your choice. Effortlessly discover, preview, and mint NFTs on BNB Smart Chain using Binance Agentic Wallet and Google Gemini.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo/mintpilot-icon-1024.png", type: "image/png" },
    ],
    apple: "/logo/mintpilot-icon-1024.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-[var(--bg)] text-[var(--ink)] transition-colors duration-300">
        {children}
      </body>
    </html>
  );
}
