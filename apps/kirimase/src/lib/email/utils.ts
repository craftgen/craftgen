import { z } from "zod";

export const emailSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
});
