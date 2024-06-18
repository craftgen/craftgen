"use client";

import { useMemo } from "react";

import { TooltipProvider } from "@craftgen/ui/components/tooltip";
import { KBar } from "@craftgen/ui/kbar/kbar";
import { TRPCReactProvider } from "@craftgen/ui/lib/api";
import { PHProvider } from "@craftgen/ui/providers/posthog-provider";
import { ThemeProvider } from "@craftgen/ui/providers/theme-provider";

import { getUrl } from "./trpc/shared";

const posthogKey = import.meta.env.VITE_POSTHOG_API_KEY;
const posthogHost = import.meta.env.VITE_POSTHOG_HOST;

export const Providers = ({ children }: { children: React.ReactNode }) => {
  const url = useMemo(() => getUrl(), []);
  return (
    <TRPCReactProvider url={url} headers={new Headers()}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <PHProvider
          apiKey={posthogKey}
          options={{
            api_host: posthogHost,
          }}
          enabled={import.meta.env.PROD}
        >
          <TooltipProvider>
            <KBar>{children}</KBar>
          </TooltipProvider>
        </PHProvider>
      </ThemeProvider>
    </TRPCReactProvider>
  );
};
