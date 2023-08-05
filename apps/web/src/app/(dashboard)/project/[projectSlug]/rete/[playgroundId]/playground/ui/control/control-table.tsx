import { ClassicPreset } from "rete";
import {
  ColumnDef,
} from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";

export class TableControl extends ClassicPreset.Control {
  __type = "table";

  constructor() {
    super();
  }
}

type Payment = {
  id: string;
  amount: number;
  status: "pending" | "processing" | "success" | "failed";
  email: string;
};

export const payments: Payment[] = [
  {
    id: "728ed52f",
    amount: 100,
    status: "pending",
    email: "m@example.com",
  },
  {
    id: "489e1d42",
    amount: 125,
    status: "processing",
    email: "example@gmail.com",
  },
];

export const columns: ColumnDef<Payment>[] = [
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "amount",
    header: "Amount",
  },
];

export function TableControlComponent(props: { data: TableControl }) {
  return <DataTable data={payments} columns={columns} />;
}
