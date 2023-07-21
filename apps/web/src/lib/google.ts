import { Session } from "@supabase/supabase-js";
import { google } from "googleapis";

export const getGoogleAuth = async ({session}: {session: Session}) => {
  const googleAuth = new google.auth.OAuth2();

  googleAuth.setCredentials({
    access_token: session?.provider_token,
    refresh_token: session?.provider_refresh_token,
  });
  return googleAuth;
}


export const getWebmaster = async ({session}: {session: Session}) => {
  const googleAuth = await getGoogleAuth({session});

  return google.webmasters({
    version: "v3",
    auth: googleAuth,
  })
}