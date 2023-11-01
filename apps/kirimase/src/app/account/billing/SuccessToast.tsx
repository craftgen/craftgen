"use client";

import { useToast } from "@/components/ui/use-toast";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function SuccessToast() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const success = searchParams.get("success") as Boolean | null;
  useEffect(() => {
    if (success) {
      toast({ description: "Successfully updated subscription." });
    }
  }, [success, toast]);

  return null;
}
