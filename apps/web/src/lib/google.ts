import { Session } from "@supabase/supabase-js";
import { db, eq, user } from "@turboseo/supabase/db";
import { google } from "googleapis";

export const getGoogleAuth = async ({ session }: { session: Session }) => {
  const googleAuth = new google.auth.OAuth2();
  const authUser = await db.query.user.findFirst({
    where: (user, { eq }) => eq(user.id, session?.user?.id),
  });
  if (!authUser) throw new Error("User not found");

  googleAuth.setCredentials({
    access_token: authUser?.google_access_token,
    refresh_token: authUser?.google_refresh_token,
  });

  // const newCreds = await googleAuth.();
  // await db
  //   .update(user)
  //   .set({
  //     google_access_token: newCreds?.credentials.access_token,
  //     google_refresh_token: newCreds?.credentials.refresh_token,
  //   })
  //   .where(eq(user.id, authUser?.id));

  return googleAuth;
};

export const getWebmaster = async ({ session }: { session: Session }) => {
  const googleAuth = await getGoogleAuth({ session });

  return google.webmasters({
    version: "v3",
    auth: googleAuth,
  });
};
