import { BASE_URL } from "@/utils/constants";
import { PostHog } from "posthog-node";

export default function PostHogClient() {
  const posthogClient = new PostHog(
    process.env.NEXT_PUBLIC_POSTHOG_KEY as string,
    {
      host: `${BASE_URL}/ingest`,
    },
  );
  return posthogClient;
}
