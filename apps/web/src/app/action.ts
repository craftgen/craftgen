"use server";

import { db, waitlist } from "@seocraft/supabase/db";

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
  const messageText = `*\\#SEOCRAFT*\nNew user: \`${params.email}\``; // Replace `params.email` with the email of the new user
  await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: -990898182,
        text: messageText,
        parse_mode: "MarkdownV2",
      }),
    }
  )
    .then((response) => response.json())
    .then((data) => console.log(data))
    .catch((error) => console.error("Error:", error));
  return User;
};
