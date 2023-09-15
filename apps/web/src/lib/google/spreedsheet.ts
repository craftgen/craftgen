import { GoogleSpreadsheet } from "google-spreadsheet";
import { getGoogleAuth } from "./auth";
import { Session } from "@supabase/supabase-js";

export const getSheet = async ({ session }: { session: Session }) => {
  const googleAuth = await getGoogleAuth({ session });

  const doc = new GoogleSpreadsheet(
    "12kTb0KQbXkx1nhLOFA1s_Xc9naNua1oPBVYqa2nne6Y",
    googleAuth
  );

  await doc.loadInfo(); // loads document properties and worksheets
  console.log("DOC>", doc.title);

  // console.log(doc.title);
  // const sheet = await doc.addSheet({ headerValues: ["name", "email"] });
  // const larryRow = await sheet.addRow({
  //   name: "Larry Page",
  //   email: "larry@google.com",
  // });
  // const moreRows = await sheet.addRows([
  //   { name: "Sergey Brin", email: "sergey@google.com" },
  //   { name: "Eric Schmidt", email: "eric@google.com" },
  // ]);

  const sheet = doc.sheetsByIndex[0]; // or use doc.sheetsById[id]
  const rows = await sheet.getRows(); // can pass in { limit, offset }

  return {
    title: doc.title,
    // sheets: doc.sheetsByIndex.map((sheet) => ({
    //   title: sheet.title,
    //   rowCount: sheet.rowCount,
    //   rows: sheet.getRows(),
    // })),
    sheet: {
      title: sheet.title,
      headers: sheet.headerValues,
      rows,
    },
  };
};
