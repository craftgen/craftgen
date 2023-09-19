import { PHProvider } from "@/components/posthog-provider";
import { ThemeProvider } from "@/components/theme-provider";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <PHProvider>{children}</PHProvider>
    </ThemeProvider>
  );
};
