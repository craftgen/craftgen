"use client";

import { PHProvider } from "@/components/posthog-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { RootProvider } from "fumadocs-ui/provider";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <PHProvider>
        <RootProvider search={{ enabled: false }}>{children}</RootProvider>
      </PHProvider>
    </ThemeProvider>
  );
};
