import "./globals.css";
import type { Metadata } from "next";
import { Inter, Noto_Sans } from "next/font/google";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter-variable" });
const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
  variable: "--font-noto-sans-variable",
});

export const metadata: Metadata = {
  title: "SEO Craft - Craft SEO content on autopilot",
  description:
    "The ultimate playground for prompt engineers. Craft multi-model AI workflows and set your content generation on autopilot.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${notoSans.variable} min-h-screen`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
