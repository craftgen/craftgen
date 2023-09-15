"use server";

import { getGoogleAuth } from "@/lib/google/auth";
import { Database } from "@seocraft/supabase/db/database.types";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { GoogleSpreadsheet, GoogleSpreadsheetRow } from "google-spreadsheet";
import { cookies } from "next/headers";
import { GoogleSheetMachineContext } from "./google-sheet";
import { Auth } from "googleapis";

type GoogleSheetServiceSettings = {
  spreadsheetId: string;
  sheetId?: number;
  auth: Auth.OAuth2Client;
};

class GoogleSpreadSheetService {
  private doc: GoogleSpreadsheet;
  // private sheet: GoogleSpreadsheetWorksheet | null = null;
  constructor(public settings: GoogleSheetServiceSettings) {
    this.doc = new GoogleSpreadsheet(settings.spreadsheetId, settings.auth);
  }

  async getSheet() {
    await this.doc.loadInfo();
    if (!this.settings.sheetId) {
      throw new Error("SheetId is not set");
    }
    return this.doc.sheetsById[this.settings.sheetId];
  }

  public async getSheets(): Promise<{ id: number; title: string }[]> {
    await this.doc.loadInfo();
    const sheets = this.doc.sheetsByIndex;
    return sheets.map((sheet) => ({
      id: sheet.sheetId,
      title: sheet.title,
    }));
  }

  public async addRow(
    rowData: any
  ): Promise<GoogleSpreadsheetRow<Record<string, any>>> {
    const sheet = await this.getSheet();
    const newRow = await sheet.addRow(rowData);

    console.log("newRow", newRow);
    return newRow;
  }

  public async getRows(params: { limit: number; offset: number }) {
    const sheet = await this.getSheet();
    return sheet.getRows(params);
  }

  public async getRow(rowId: number) {
    const sheet = await this.getSheet();
    return sheet.getRows({
      offset: rowId,
      limit: 1,
    });
  }

  public async getHeaders(): Promise<string[]> {
    const sheet = await this.getSheet();
    await sheet.loadHeaderRow();
    return sheet.headerValues;
  }
}

const getSheet = async (settings: GoogleSheetMachineContext) => {
  const supabase = createServerActionClient<Database>({ cookies });
  const session = await supabase.auth.getSession();
  const auth = await getGoogleAuth({ session: session.data.session! });

  return new GoogleSpreadSheetService({
    spreadsheetId: settings.settings.spreadsheet?.id!,
    sheetId: settings.settings.sheet?.id || undefined,
    auth,
  });
};

export const getSheets = async (settings: GoogleSheetMachineContext) => {
  const spreadsheet = await getSheet(settings);
  return spreadsheet.getSheets();
};

export const getHeaders = async (settings: GoogleSheetMachineContext) => {
  const spreadsheet = await getSheet(settings);
  return spreadsheet.getHeaders();
};

export const addRow = async (settings: GoogleSheetMachineContext) => {
  const spreadsheet = await getSheet(settings);
  await spreadsheet.addRow(settings.inputs);
};

export const readRows = async (settings: GoogleSheetMachineContext) => {
  const spreadsheet = await getSheet(settings);
  return spreadsheet.getRows({
    limit: settings.inputs?.limit,
    offset: settings.inputs?.offset,
  });
};

export const readRow = async (settings: GoogleSheetMachineContext) => {
  const spreadsheet = await getSheet(settings);
  return spreadsheet.getRow(settings.inputs?.rowId);
};
