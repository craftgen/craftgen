import type { Session } from "@supabase/supabase-js";
import { google } from "googleapis";

import { db } from "@seocraft/supabase/db";

export const getGoogleAuth = async ({ session }: { session: Session }) => {
  const googleAuth = new google.auth.OAuth2({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  });
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

export const getDrive = async ({ session }: { session: Session }) => {
  const googleAuth = await getGoogleAuth({ session });

  const drive = google.drive({
    version: "v3",
    auth: googleAuth,
  });

  return drive;
};

export const getSpreadsheetData = async ({
  session,
  query,
}: {
  session: Session;
  query: string;
}) => {
  const googleAuth = await getGoogleAuth({ session });
  const drive = google.drive({ version: "v3", auth: googleAuth });

  const response = await drive.files.list({
    q: `mimeType='application/vnd.google-apps.spreadsheet' and name contains '${query}'`,
    pageSize: 10,
    fields: "nextPageToken, files(id, name)",
  });

  return response.data.files;
};

export const getSheets = async ({ session }: { session: Session }) => {
  const googleAuth = await getGoogleAuth({ session });

  const sheets = google.sheets({
    version: "v4",
    auth: googleAuth,
  });

  return sheets;
};
