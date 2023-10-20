"use server";

// import { getGoogleAuth } from "@/lib/google/auth";
import { Database } from "@seocraft/supabase/db/database.types";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { GoogleSpreadsheet, GoogleSpreadsheetRow } from "google-spreadsheet";
import { cookies } from "next/headers";
import { type GoogleSheetMachineSettingsContext } from "./google-sheet";
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

  public async addRow(rowData: any) {
    const sheet = await this.getSheet();
    const newRow = await sheet.addRow(rowData);

    return newRow.toObject();
  }

  public async getRows(params: { limit: number; offset: number }) {
    const sheet = await this.getSheet();
    const result = await sheet.getRows(params);
    return result.map((r) => r.toObject());
  }

  public async getRow(rowIndex: number) {
    const sheet = await this.getSheet();
    const result = await sheet.getRows({
      offset: rowIndex,
      limit: 1,
    });

    const [row] = result;
    return row.toObject();
  }

  public async getHeaders(): Promise<string[]> {
    const sheet = await this.getSheet();
    await sheet.loadHeaderRow();
    return sheet.headerValues;
  }
}

const getSheet = async (settings: GoogleSheetMachineSettingsContext) => {
  const supabase = createServerActionClient<Database>({ cookies });
  const session = await supabase.auth.getSession();
  const auth = await getGoogleAuth({ session: session.data.session! });

  return new GoogleSpreadSheetService({
    spreadsheetId: settings.spreadsheet?.id!,
    sheetId: settings.sheet?.id || undefined,
    auth,
  });
};

export const getSheets = async (
  settings: GoogleSheetMachineSettingsContext
) => {
  const spreadsheet = await getSheet(settings);
  return spreadsheet.getSheets();
};

export const getHeaders = async (
  settings: GoogleSheetMachineSettingsContext
) => {
  const spreadsheet = await getSheet(settings);
  return spreadsheet.getHeaders();
};

export const addRow = async (params: {
  settings: GoogleSheetMachineSettingsContext;
  inputs: Record<string, any>;
}) => {
  const spreadsheet = await getSheet(params.settings);
  return await spreadsheet.addRow(params.inputs);
};

export const readRows = async (params: {
  settings: GoogleSheetMachineSettingsContext;
  limit: number;
  offset: number;
}) => {
  const spreadsheet = await getSheet(params.settings);
  return spreadsheet.getRows({
    limit: params.limit,
    offset: params.offset,
  });
};

export const readRow = async (params: {
  settings: GoogleSheetMachineSettingsContext;
  rowIndex: number;
}) => {
  const spreadsheet = await getSheet(params.settings);
  return spreadsheet.getRow(params.rowIndex);
};
