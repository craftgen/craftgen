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
import * as FlexLayout from "flexlayout-react";

import { useRegisterReplicateActions } from "./replicate-actions";

export const useRegisterPlaygroundActions = ({
  di,
  layout,
}: {
  di: Editor | null;
  layout: FlexLayout.Model;
}) => {
  const nodes = useMemo(() => {
    if (!di) return [];
    return Array.from(di?.nodeMeta.values()).map((node) => {
      const Icon = Icons[node.icon as keyof typeof Icons] ?? Icons.component;

      return {
        ...node,
        nodeType: node.nodeType as NodeTypes,
        icon: <Icon className={"text-muted-foreground mr-2"} />,
      };
    });
  }, [di?.nodeMeta]);

  const { mutateAsync: createAssistant } =
    api.openai.assistant.create.useMutation();

  useRegisterReplicateActions({ di, layout });
  const actions = useMemo(() => {
    const res = [];
    // res.push({
    //   id: "OpenAI",
    //   name: "OpenAI",
    //   keywords: "openai",
    //   subtitle: "Add a module to your workflow",
    //   section: "Nodes",
    //   icon: <Icons.component className={"text-muted-foreground mr-2"} />,
    // });
    res.push({
      id: "ModuleNode",
      name: "Module",
      keywords: "module",
      subtitle: "Add a module to your workflow",
      section: "Nodes",
      icon: <Icons.component className={"text-muted-foreground mr-2"} />,
    });
    // res.push({
    //   id: "Tools",
    //   name: "Tools",
    //   keywords: "tool",
    //   section: "Nodes",
    //   subtitle: "Tools to help you build your workflow",
    //   icon: <Icons.pocketKnife className={"text-muted-foreground mr-2"} />,
    // });
    res.push({
      id: "assistant",
      name: "Assistant",
      keywords: "assistant",
      section: "Nodes",
      icon: <Icons.bot className={"text-muted-foreground mr-2"} />,
    });
    res.push({
      id: "assistant-new",
      name: "new Assistant",
      keywords: "assistant",
      parent: "assistant",
      icon: <Icons.add className={"text-muted-foreground mr-2"} />,
      perform: async () => {
        const assistant = await createAssistant();
        await di?.addNode("OpenAIAssistant", {
          settings: {
            assistant,
          },
        });
      },
    });
    res.push(
      ...(nodes
        .filter((n) => n.nodeType !== "NodeModule")
        .filter((n) => n.nodeType !== "NodeReplicate")
        .filter((n) => n.nodeType !== "NodeRestApi")
        .map((node) => ({
          id: node.nodeType,
          name: node.label,
          // parent: node?.section ?? undefined,
          subtitle: node.description,
          section: node.section ?? "Nodes",
          perform: async () => {
            await di?.addNode(node.nodeType as NodeTypes);
          },
          icon: node.icon as any,
        })) as Action[]),
    );
    res.push(
      {
        id: "API",
        name: "API",
        keywords: "openapi, api, rest",
        subtitle: "Add Rest API to your workflow",
      },
      {
        id: "NodeRestApi-fromOpenAPI",
        name: "Rest API from OpenAPI spec",
        keywords: "rest api from openapi spec",
        subtitle: "Add Rest API to your workflow",
        parent: "API",
        perform: async () => {
          console.log("di", di);
          // await di?.addNode("NodeRestApi");
        },
      },
      {
        id: "NodeRestApi",
        name: "Rest API",
        keywords: "rest api",
        subtitle: "Add Rest API to your workflow",
        parent: "API",
        perform: async () => {
          console.log("di", di);
          await di?.addNode("NodeRestApi");
        },
      },
      {
        id: "NodeGraphqlApi",
        name: "GraphQL API",
        keywords: "graphql api",
        subtitle: "Add GraphQL API to your workflow",
        parent: "API",
        perform: async () => {
          await di?.addNode("NodeGraphqlApi");
        },
      },
    );
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
      // replicateModel,
    };
  });

  const { data: workflowModules } = useSWR(
    "/api/modules" + q,
    async () => {
      const res = await searchModulesMeta({
        query: q,
        currentModuleId: di?.workflowId!,
      });
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
            name: assistant.name ?? assistant.id,
            parent: "assistant",
            icon: <Icons.bot className={"text-muted-foreground mr-2"} />,
            section: "Assistants",
            perform: async () => {
              await di?.addNode("OpenAIAssistant", {
                settings: {
                  assistant,
                },
              });
            },
          }) as Action,
      ) || []
    );
  }, [assistants]);

  const utils = api.useUtils();

  const workflowActions = useMemo<Action[]>(() => {
    return (
      workflowVersions?.map(
        (version) =>
          ({
            id: version.id,
            name: `@${version.workflow.projectSlug}/${version.workflow.name}v${version.version}`,
            parent: version.workflowId,
            perform: async () => {
              const module = await utils.craft.module.getById.fetch({
                versionId: version.id,
              });
              console.log("MODULE", module);
              di?.addNode(
                "NodeModule",
                {
                  // moduleId: version.id,
                  ...module.context?.state,
                },
                {
                  label: `@${version.workflow.projectSlug}/${version.workflow.name}`,
                },
              );
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
    ]
      .filter(Boolean)
      .map(
        (a) =>
          ({
            ...a,
            priority: Priority.HIGH,
          }) as Action,
      ),
    [actions, moduleActions, orgActions, workflowActions, assistantActions],
  );
};
