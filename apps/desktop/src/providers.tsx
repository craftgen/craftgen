"use client";

import { useMemo } from "react";
import { ClerkProvider } from "@clerk/clerk-react";

import { Toaster } from "@craftgen/ui/components/sonner";
import { TooltipProvider } from "@craftgen/ui/components/tooltip";
import { KBar } from "@craftgen/ui/kbar/kbar";
import { TRPCReactProvider } from "@craftgen/ui/lib/api";
import { PHProvider } from "@craftgen/ui/providers/posthog-provider";
import { ThemeProvider } from "@craftgen/ui/providers/theme-provider";

import { getUrl } from "./trpc/shared";

const posthogKey = import.meta.env.VITE_POSTHOG_API_KEY;
const posthogHost = import.meta.env.VITE_POSTHOG_HOST;

// Import your publishable key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

export const Providers = ({ children }: { children: React.ReactNode }) => {
  const url = useMemo(() => getUrl(), []);

  const headers = () => {
    const headers = new Headers();
    headers.set("x-trpc-source", "desktop");
    const cookieName = import.meta.env.DEV
      ? "sb-localhost-auth-token"
      : "sb-siwhcblzmpihqdvvooqz-auth-token";
    if (localStorage.getItem(cookieName)) {
      const cok = localStorage.getItem(cookieName);
      headers.set("Authorization", `Bearer ${JSON.parse(cok).access_token}`);
    }

    console.log(headers);

    return headers;
  };

  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <TRPCReactProvider url={url} headers={headers()}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <PHProvider
            apiKey={posthogKey}
            options={{
              api_host: posthogHost,
            }}
            enabled={import.meta.env.PROD}
          >
            <TooltipProvider>
              <KBar>
                {children}
                <Toaster position="top-right" />
              </KBar>
            </TooltipProvider>
          </PHProvider>
        </ThemeProvider>
      </TRPCReactProvider>
    </ClerkProvider>
  );
};
