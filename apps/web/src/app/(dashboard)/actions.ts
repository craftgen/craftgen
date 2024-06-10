"use server";

import { cookies } from "next/headers";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";

import { db, user } from "@craftgen/db/db";

import { sendTGMessage } from "../action";

export const getUser = async () => {
  const supabase = createServerActionClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("User not found");
  const user = await db.query.user.findFirst({
    where: (user, { eq }) => eq(user.id, session?.user.id),
    columns: {
      email: true,
      fullName: true,
      username: true,
      avatar_url: true,
    },
  });
  return user;
};

export const sendFeedback = async (params: {
  feedback: string;
  satisfaction: string;
}) => {
  const supabase = createServerActionClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const messageText = `*\\#SEOCRAFT*\n\\#Feedback\nuser: \`${session?.user.email}\`\nsatisfaction: ${params.satisfaction}\n\\-\\-\\-\\-\n\`${params.feedback}\`\n\\-\\-\\-\\-`;
  await sendTGMessage({ message: messageText });
};

export const persistGoogleToken = async () => {
  const supabase = createServerActionClient({ cookies });
  const session = await supabase.auth.getSession();
  if (
    session?.data.session?.provider_token &&
    session?.data.session?.provider_refresh_token
  ) {
    await db.update(user).set({
      google_access_token: session?.data.session.provider_token,
      google_refresh_token: session?.data.session.provider_refresh_token,
    });
  }
};
