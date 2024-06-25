"use server";

import { db, waitlist } from "@craftgen/db/db";

import { getServiceSupabase } from "@/utils/supabase/service";

export const addToWaitlist = async (params: {
  email: string;
  platforms?: string[];
}) => {
  const admin = getServiceSupabase();

  const User = await db
    .insert(waitlist)
    .values({
      email: params.email,
      platforms: params.platforms ?? [],
    })
    .onConflictDoNothing()
    .returning();
  const messageText = `*\\#Craftgen*\nNew user: \`${params.email}\``; // Replace `params.email` with the email of the new user

  await sendTGMessage({ message: messageText });

  await admin.auth.admin.inviteUserByEmail(params.email);

  return User;
};

export const sendTGMessage = async (params: { message: string }) => {
  await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: "-1002025278887",
        text: params.message,
        parse_mode: "MarkdownV2",
      }),
    },
  )
    .then((response) => response.json())
    .then((data) => console.log(data))
    .catch((error) => console.error("Error:", error));
};
