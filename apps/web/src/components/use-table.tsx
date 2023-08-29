import { Table } from "@tanstack/react-table";
import { createContext, useContext } from "react";

export const TableContext = createContext<Table<any> | null>(null);

export const useTable = () => {
  const val = useContext(TableContext);
  if (!val) {
    throw new Error("No table context");
  }
  return val;
};
