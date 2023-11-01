"use client";

import { Action, useKBar, useRegisterActions, Priority } from "kbar";
import { useEffect, useMemo, useState } from "react";
import { NodeTypes } from "@seocraft/core/src/types";
import { Icons } from "@/components/icons";
import { Editor } from "@seocraft/core";
import useSWR from "swr";
import { debounce } from "lodash-es";
import { searchModulesMeta } from "@/actions/search-modules-meta";
import { searchOrgsMeta } from "@/actions/search-orgs-meta";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getWorkflowVersionsById } from "@/actions/get-workflow-versions";
import { useDebounce } from "./ui/hooks";

export const useRegisterPlaygroundActions = ({ di }: { di: Editor | null }) => {
  const nodes = useMemo(() => {
    if (!di) return [];
    return Array.from(di?.nodeMeta.values()).map((node) => {
      const Icon = Icons[node.icon as keyof typeof Icons];
      return {
        ...node,
        nodeType: node.nodeType as NodeTypes,
        icon: <Icon className={"text-muted-foreground mr-2"} />,
      };
    });
  }, [di?.nodeMeta]);
  const actions = useMemo(() => {
    const res = nodes
      .filter((n) => n.nodeType !== "ModuleNode")
      .map((node) => ({
        id: node.nodeType,
        name: node.label,
        section: "Nodes",
        perform: async () => {
          await di?.addNode(node.nodeType as NodeTypes);
        },
        icon: node.icon as any,
      })) as Action[];
    res.push({
      id: "ModuleNode",
      name: "Module",
      keywords: "module",
      subtitle: "Add a module to your workflow",
      section: "Nodes",
      icon: <Icons.component className={"text-muted-foreground mr-2"} />,
    });
    return res;
  }, [nodes]);

  const [q, _setQuery] = useState<string | undefined>(undefined);
  const setQuery = debounce(_setQuery, 250, { maxWait: 600 });
  const [p, _setProject] = useState<string | undefined>(undefined);
  const setProject = debounce(_setProject, 250, { maxWait: 600 });
  const [w, _setWorkflow] = useState<string | undefined>(undefined);
  const setWorkflow = debounce(_setWorkflow, 250, { maxWait: 600 });

  const { options } = useKBar((state) => {
    console.log({ state });
    if (state.currentRootActionId === "ModuleNode") {
      setQuery(state.searchQuery);
    }
    if (state.currentRootActionId?.startsWith("project_")) {
      setProject(state.currentRootActionId);
    }
    if (state.currentRootActionId?.startsWith("workflow_")) {
      setWorkflow(state.currentRootActionId);
    }
  });

  const { data: workflowModules } = useSWR(
    "/api/modules" + q,
    async () => {
      const res = await searchModulesMeta({ query: q });
      return res?.data || [];
    },
    {
      keepPreviousData: true,
    }
  );

  const { data: orgs } = useSWR(
    "/api/orgs" + q,
    async () => {
      const res = await searchOrgsMeta({ query: q });
      return res.data;
    },
    {
      keepPreviousData: true,
    }
  );

  const { data: workflowVersions } = useSWR(
    w ? `/api/workflow/${w}/versions` : null,
    async () => {
      if (!w) return [];
      console.log("calling", { w });
      const res = await getWorkflowVersionsById({
        workflowId: w,
      });
      console.log({ res });
      return res.data;
    },
    {
      keepPreviousData: true,
    }
  );

  console.log({ workflowVersions, w });
  const workflowActions = useMemo<Action[]>(() => {
    // return [];
    console.log({ workflowVersions });
    return (
      workflowVersions?.map(
        (version) =>
          ({
            id: version.id,
            name: `@${version.workflow.projectSlug}/${version.workflow.name}v${version.version}`,
            parent: version.workflowId,
          } as Action)
      ) || []
    );
  }, [workflowVersions]);

  const orgActions = useMemo<Action[]>(() => {
    return (
      (orgs?.map((org) => {
        return {
          id: org.id,
          name: org.name,
          section: "Organizations",
          parent: `ModuleNode`,
          icon: (
            <Avatar className="mr-2 h-5 w-5">
              <AvatarImage
                src={`https://avatar.vercel.sh/${org.slug}.png`}
                alt={org?.name}
              />
              <AvatarFallback>SC</AvatarFallback>
            </Avatar>
          ),
        };
      }) as Action[]) || []
    );
  }, [orgs]);

  const moduleActions = useMemo<Action[]>(() => {
    return (
      (workflowModules?.map((workflow) => {
        return {
          id: workflow.id,
          name: `${workflow.owner}/${workflow.name}`,
          section: "Module",
          parent: `ModuleNode`,
          priority: Priority.HIGH,
          icon: <Icons.component className={"text-muted-foreground mr-2"} />,
        };
      }) as Action[]) || []
    );
  }, [workflowModules]);

  useRegisterActions(
    [...actions, ...moduleActions, ...orgActions, ...workflowActions].filter(
      Boolean
    ),
    [actions, moduleActions, orgActions, workflowActions]
  );
};
