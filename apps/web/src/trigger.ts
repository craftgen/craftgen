import { TriggerClient } from "@trigger.dev/sdk";

export const client = new TriggerClient({
  id: "seocraft-4L3U",
  apiKey: process.env.TRIGGER_API_KEY,
  apiUrl: process.env.TRIGGER_API_URL,
});
