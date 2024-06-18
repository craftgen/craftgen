"use client";

import React from "react";
import { RootProvider } from "fumadocs-ui/provider";

import { TooltipProvider } from "@craftgen/ui/components/tooltip";
import { KBar } from "@craftgen/ui/kbar/kbar";
import { PHProvider } from "@craftgen/ui/providers/posthog-provider";
import { ThemeProvider } from "@craftgen/ui/providers/theme-provider";

import { BASE_URL } from "@/lib/constants";

import { useRegisterKAuthActions } from "./useRegisterKAuthActions";

export const Providers = ({ children }: { children: React.ReactNode }) => {
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
          <KBar>
            <RootProvider search={{ enabled: false }}>
              <RegisterKactions>{children}</RegisterKactions>
            </RootProvider>
          </KBar>
        </TooltipProvider>
      </PHProvider>
    </ThemeProvider>
  );
};

const RegisterKactions: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useRegisterKAuthActions();
  return <>{children}</>;
};
