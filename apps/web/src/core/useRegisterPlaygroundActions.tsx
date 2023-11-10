"use client";

import { useMemo, useState } from "react";
import type { Action } from "kbar";
import { Priority, useKBar, useRegisterActions } from "kbar";
import { debounce } from "lodash-es";
import useSWR from "swr";

import type { Editor } from "@seocraft/core";
import type { NodeTypes } from "@seocraft/core/src/types";

import { searchModulesMeta } from "@/actions/search-modules-meta";
import { searchOrgsMeta } from "@/actions/search-orgs-meta";
import { Icons } from "@/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api } from "@/trpc/react";

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
    res.push({
      id: "assistant",
      name: "Assistant",
      keywords: "assistant",
      icon: <Icons.bot className={"text-muted-foreground mr-2"} />,
    });
    return res;
  }, [nodes]);

  const [q, _setQuery] = useState<string | undefined>(undefined);
  const setQuery = debounce(_setQuery, 250, { maxWait: 600 });
  const [p, _setProject] = useState<string | undefined>(undefined);
  const setProject = debounce(_setProject, 250, { maxWait: 600 });
  const [w, _setWorkflow] = useState<string | undefined>(undefined);
  const setWorkflow = debounce(_setWorkflow, 250, { maxWait: 600 });

  const { options, query, currentRootActionId } = useKBar((state) => {
    if (state.currentRootActionId === "ModuleNode") {
      setQuery(state.searchQuery);
    }
    if (state.currentRootActionId?.startsWith("project_")) {
      setProject(state.currentRootActionId);
    }
    if (state.currentRootActionId?.startsWith("workflow_")) {
      setWorkflow(state.currentRootActionId);
    }
    return {
      currentRootActionId: state.currentRootActionId,
    };
  });

  const { data: workflowModules } = useSWR(
    "/api/modules" + q,
    async () => {
      const res = await searchModulesMeta({ query: q });
      return res?.data || [];
    },
    {
      keepPreviousData: true,
    },
  );

  const { data: orgs } = useSWR(
    "/api/orgs" + q,
    async () => {
      const res = await searchOrgsMeta({ query: q });
      return res.data;
    },
    {
      keepPreviousData: true,
    },
  );

  const { data: workflowVersions } = api.craft.version.list.useQuery(
    {
      workflowId: w!,
    },
    {
      enabled: !!w,
      keepPreviousData: true,
    },
  );
  const { data: assistants } = api.openai.assistant.list.useQuery(
    { projectId: di?.projectId! },
    { enabled: currentRootActionId === "assistant", keepPreviousData: true },
  );
  const assistantActions = useMemo<Action[]>(() => {
    return (
      assistants?.data.map(
        (assistant) =>
          ({
            id: assistant.id,
            name: assistant.name,
            parent: "assistant",
            perform: async () => {
              await di?.addNode("OpenAIAssistant", {
                settings: {
                  assistantId: assistant.id,
                  config: {
                    name: assistant.name,
                    model: assistant.model,
                    instructions: assistant.instructions,
                    tools: assistant.tools,
                  },
                },
              });
            },
          }) as Action,
      ) || []
    );
  }, [assistants]);

  const workflowActions = useMemo<Action[]>(() => {
    return (
      workflowVersions?.map(
        (version) =>
          ({
            id: version.id,
            name: `@${version.workflow.projectSlug}/${version.workflow.name}v${version.version}`,
            parent: version.workflowId,
            perform: async () => {
              di?.addNode("ModuleNode", {
                moduleId: version.id,
              });
            },
          }) as Action,
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
    [
      ...actions,
      ...moduleActions,
      ...orgActions,
      ...workflowActions,
      ...assistantActions,
    ].filter(Boolean),
    [actions, moduleActions, orgActions, workflowActions, assistantActions],
  );
};
