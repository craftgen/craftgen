"use client";

import { PHProvider } from "@craftgen/ui/providers/posthog-provider";
import { ThemeProvider } from "@craftgen/ui/providers/theme-provider";

import { TRPCReactProvider } from "./trpc/react";

const posthogKey = import.meta.env.VITE_POSTHOG_API_KEY;
const posthogHost = import.meta.env.VITE_POSTHOG_HOST;

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <TRPCReactProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <PHProvider
          apiKey={posthogKey}
          options={{
            api_host: posthogHost,
          }}
          enabled={import.meta.env.PROD}
        >
          {children}
        </PHProvider>
      </ThemeProvider>
    </TRPCReactProvider>
  );
};
