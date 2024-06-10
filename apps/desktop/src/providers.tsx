"use client";

// import { PHProvider } from "@/components/posthog-provider";
// import { ThemeProvider } from "@/components/theme-provider";
import { TRPCReactProvider } from "./trpc/react";

//TODO: Add Posthog
export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <TRPCReactProvider>
      {/* <ThemeProvider attribute="class" defaultTheme="system" enableSystem> */}
      {children}
      {/* <PHProvider>{children}</PHProvider> */}
      {/* </ThemeProvider> */}
    </TRPCReactProvider>
  );
};
