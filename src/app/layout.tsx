import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MintPilot — Natural-Language NFT Minting on BNB Smart Chain",
  description:
    "Your intent. Your wallet. Your choice. Effortlessly discover, preview, and mint NFTs on BNB Smart Chain using Binance Agentic Wallet and Google Gemini.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-apple-bg text-apple-text dark:bg-apple-darkBg dark:text-apple-darkText transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
