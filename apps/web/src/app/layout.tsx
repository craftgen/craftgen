import "./globals.css";

import type { Metadata } from "next";
import { Inter, Noto_Sans } from "next/font/google";
import { headers } from "next/headers";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GeistMono, GeistSans } from "geist/font";

import { Toaster } from "@craftgen/ui/components/sonner";
import { TRPCReactProvider } from "@craftgen/ui/lib/api";

import { PHIdentify } from "@/components/ph-identify";
import { getUrl } from "@/trpc/shared";

// import { TRPCReactProvider } from "@/trpc/react";

import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter-variable" });
const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
  variable: "--font-noto-sans-variable",
});

export const metadata: Metadata = {
  title: "Craftgen - Craft Generetive AI Workflows",
  description:
    "The ultimate playground for prompt engineers. Craft multi-model AI workflows and set your content generation on autopilot.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${inter.variable} ${notoSans.variable} ${GeistSans.variable} ${GeistMono.variable} min-h-screen`}
      >
        <TRPCReactProvider headers={headers()} url={getUrl()}>
          <Providers>
            {children}
            <Analytics />
            <SpeedInsights />
            <Toaster />
            <PHIdentify />
          </Providers>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
