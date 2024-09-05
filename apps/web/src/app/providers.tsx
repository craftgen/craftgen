"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { RootProvider } from "fumadocs-ui/provider";
import { useTheme } from "next-themes";

import { TooltipProvider } from "@craftgen/ui/components/tooltip";
import { KBar } from "@craftgen/ui/kbar/kbar";
import { PHProvider } from "@craftgen/ui/providers/posthog-provider";
import { ThemeProvider } from "@craftgen/ui/providers/theme-provider";

import { BASE_URL } from "@/lib/constants";

import { useRegisterKAuthActions } from "./useRegisterKAuthActions";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ClerkProviderWithTheme>
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
      </ClerkProviderWithTheme>
    </ThemeProvider>
  );
};

const RegisterKactions: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useRegisterKAuthActions();
  return <>{children}</>;
};

const ClerkProviderWithTheme = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { theme } = useTheme();
  // const background = useMemo(
  //   () => getComputedStyle(document.body).getPropertyValue("--background"),
  //   [],
  // );
  // const foreground = useMemo(
  //   () => getComputedStyle(document.body).getPropertyValue("--foreground"),
  //   [],
  // );
  const [variables, setVariables] = useState({
    // colorBackground: "#ffffff",
  });
  useEffect(() => {
    const background = getComputedStyle(document.body).getPropertyValue(
      "--background",
    );
    const foreground = getComputedStyle(document.body).getPropertyValue(
      "--foreground",
    );
    // setVariables({
    //   // colorBackground: `hsl(${background})`,
    //   // colorForeground: foreground,
    // });
  }, [theme]);

  return (
    <ClerkProvider
      appearance={{
        baseTheme: theme === "dark" ? dark : undefined,
        variables: variables,
      }}
    >
      {children}
    </ClerkProvider>
  );
};
