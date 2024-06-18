"use client";

import { useRouter, useSelectedLayoutSegment } from "next/navigation";

import { Tabs, TabsList, TabsTrigger } from "@craftgen/ui/components/tabs";

export const WorkflowTabs = ({ moduleId }: { moduleId: string }) => {
  const segment = useSelectedLayoutSegment();
  const router = useRouter();
  return (
    <Tabs
      className="mt-4"
      defaultValue={segment ?? "demo"}
      onValueChange={(v) => {
        const path = v === "demo" ? "" : `/${v}`;
        router.push(`/${moduleId}${path}`);
      }}
    >
      <TabsList>
        <TabsTrigger value="demo">Demo</TabsTrigger>
        <TabsTrigger value="api">API</TabsTrigger>
        <TabsTrigger value="versions">Versions</TabsTrigger>
      </TabsList>
    </Tabs>
  );
};
