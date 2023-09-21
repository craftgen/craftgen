"use server";

import { db, waitlist } from "@seocraft/supabase/db";
import { Bot } from "grammy";

console.log(process.env.TELEGRAM_BOT_TOKEN);
const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN as string);

export const addToWaitlist = async (params: {
  email: string;
  platforms?: string[];
}) => {
  const User = await db
    .insert(waitlist)
    .values({
      email: params.email,
      platforms: params.platforms || [],
    })
    .onConflictDoNothing()
    .returning();
  await bot.api.sendMessage(
    -990898182,
    `
    *\\#SEOCRAFT*
    New user: \`${params.email}\`
    `,
    {
      parse_mode: "MarkdownV2",
    }
  );
  return User;
};
