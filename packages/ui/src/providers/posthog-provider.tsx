import type { PostHogConfig } from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

export function PHProvider({
  children,
  options,
  apiKey,
  enabled = true,
}: {
  children: React.ReactNode;
  apiKey: string;
  options: Partial<PostHogConfig>;
  enabled?: boolean;
}) {
  if (!enabled) {
    return <>{children}</>;
  }
  return (
    <PostHogProvider
      apiKey={apiKey}
      options={{
        ...options,
      }}
    >
      {children}
    </PostHogProvider>
  );
}
