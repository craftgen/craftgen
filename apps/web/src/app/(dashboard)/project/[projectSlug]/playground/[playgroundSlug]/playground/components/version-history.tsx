"use client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import useSWR from "swr";
import { getWorkflowVersions } from "../../action";
import { useState } from "react";

export const VersionHistory: React.FC<{
  projectSlug: string;
  workflowSlug: string;
}> = ({ projectSlug, workflowSlug }) => {
  const [open, setOpen] = useState(false);

  const { data } = useSWR(open ? "/api/workflow/versions" : null, () =>
    getWorkflowVersions({ projectSlug, workflowSlug })
  );
  console.log(data);
  return null;
};
