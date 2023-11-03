import { PostHog } from "posthog-node";

import { BASE_URL } from "@/utils/constants";

export default function PostHogClient() {
  const posthogClient = new PostHog(
    process.env.NEXT_PUBLIC_POSTHOG_KEY as string,
    {
      host: `${BASE_URL}/ingest`,
    },
  );
  return posthogClient;
}
