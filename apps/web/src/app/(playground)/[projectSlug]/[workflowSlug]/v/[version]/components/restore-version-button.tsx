"use client";

import { Button } from "@craftgen/ui/button";
import { useToast } from "@craftgen/ui/use-toast";

export const RestoreVersionButton = ({}) => {
  const { toast } = useToast();
  const handleRestoreVersion = async () => {
    toast({
      title: "Not implemented yet",
      description: "Coming soon.",
    });
  };
  return (
    <Button onClick={handleRestoreVersion} variant={"outline"}>
      Restore
    </Button>
  );
};
