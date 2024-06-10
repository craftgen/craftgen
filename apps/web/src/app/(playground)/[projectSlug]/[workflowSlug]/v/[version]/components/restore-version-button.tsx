"use client";

import { Button } from "@craftgen/ui/components/button";
import { useToast } from "@craftgen/ui/components/use-toast";

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
