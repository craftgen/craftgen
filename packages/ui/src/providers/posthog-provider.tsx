"use client";

// import { useEffect } from "react";
// import { usePathname, useSearchParams } from "next/navigation";
// import posthog from "posthog-js";
import type { PostHogConfig } from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

// import { BASE_URL } from "@/utils/constants";

// if (typeof window !== "undefined" && process.env.NODE_ENV !== "development") {
//   posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
//     api_host: `${BASE_URL}/ingest`,
//   });
// }

// export function PostHogPageview(): JSX.Element {
//   const pathname = usePathname();
//   const searchParams = useSearchParams();

//   useEffect(() => {
//     if (pathname) {
//       let url = window.origin + pathname;
//       if (searchParams && searchParams.toString()) {
//         url = url + `?${searchParams.toString()}`;
//       }
//       posthog.capture("$pageview", {
//         $current_url: url,
//       });
//     }
//   }, [pathname, searchParams]);

//   return <></>;
// }

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
