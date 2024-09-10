import { z } from "zod";

export const normalizeUrl = (url: string) => {
  if (url.startsWith("http://")) {
    return url.replace("http://", "https://");
  }
  if (url.startsWith("sc-domain:")) {
    return url.replace("sc-domain:", "");
  }

  return url;
};

export const newProjectSchema = z.object({
  name: z.string().min(2).max(50),
  site: z.string().url().optional(),
  slug: z.string().min(2).max(50),
});
