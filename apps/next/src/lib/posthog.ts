import { PostHog } from "posthog-node";

import { env } from "@/env.mjs";
import { BASE_URL } from "@/utils/constants";

export default function PostHogClient() {
  const posthogClient = new PostHog(env.NEXT_PUBLIC_POSTHOG_KEY, {
    host: `${BASE_URL}/ingest`,
  });
  return posthogClient;
}
