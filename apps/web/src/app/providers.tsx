"use client";

import { PHProvider } from "@/components/posthog-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { RootProvider } from "fumadocs-ui/provider";
import { useRegisterKAuthActions } from "./useRegisterKAuthActions";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  useRegisterKAuthActions();
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <PHProvider>
        <RootProvider search={{ enabled: false }}>{children}</RootProvider>
      </PHProvider>
    </ThemeProvider>
  );
};
