"use client";

import { Button } from "@craftgen/ui/components/button";
import { toast } from "@craftgen/ui/components/use-toast";

export const RestoreVersionButton = ({}) => {
  const handleRestoreVersion = async () => {
    toast.info("Not implemented yet", {
      description: "Coming soon.",
    });
  };
  return (
    <Button onClick={handleRestoreVersion} variant={"outline"}>
      Restore
    </Button>
  );
};
