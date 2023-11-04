import { createContext, useContext } from "react";
import type { Table } from "@tanstack/react-table";

export const TableContext = createContext<Table<any> | null>(null);

export const useTable = () => {
  const val = useContext(TableContext);
  if (!val) {
    throw new Error("No table context");
  }
  return val;
};
