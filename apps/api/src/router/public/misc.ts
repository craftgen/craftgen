import { z } from "zod";

import { sendTGMessage } from "../../telegram";
import { createTRPCRouter, publicProcedure } from "../../trpc";

export const miscRouter = createTRPCRouter({
  feedback: publicProcedure
    .input(
      z.object({
        feedback: z.string().min(3),
        satisfaction: z.enum(["awesome", "good", "bad", "worst"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      console.log("FEEDBACK", input);
      const messageText = `*\\#SEOCRAFT*\n\\#Feedback\nuser: \`${ctx?.session?.user.email}\`\nsatisfaction: ${input.satisfaction}\n\\-\\-\\-\\-\n\`${input.feedback}\`\n\\-\\-\\-\\-`;
      await sendTGMessage({ message: messageText });
    }),
});
