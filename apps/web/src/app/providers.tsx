"use client";

import { RootProvider } from "fumadocs-ui/provider";

import { TooltipProvider } from "@craftgen/ui/components/tooltip";
import { PHProvider } from "@craftgen/ui/providers/posthog-provider";
import { ThemeProvider } from "@craftgen/ui/providers/theme-provider";

import { BASE_URL } from "@/lib/constants";

import { useRegisterKAuthActions } from "./useRegisterKAuthActions";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  useRegisterKAuthActions();
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <PHProvider
        apiKey={process.env.NEXT_PUBLIC_POSTHOG_KEY!}
        enabled={process.env.NODE_ENV !== "development"}
        options={{
          api_host: `${BASE_URL}/ingest`,
        }}
      >
        <TooltipProvider>
          <RootProvider search={{ enabled: false }}>{children}</RootProvider>
        </TooltipProvider>
      </PHProvider>
    </ThemeProvider>
  );
};
