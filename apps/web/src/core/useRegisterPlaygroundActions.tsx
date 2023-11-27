"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDistance } from "date-fns";
import type { Action } from "kbar";
import { Priority, useKBar, useRegisterActions } from "kbar";
import { debounce, flatten, isNil } from "lodash-es";
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

  const { mutateAsync: createAssistant } =
    api.openai.assistant.create.useMutation();
  const actions = useMemo(() => {
    const res = [];

    res.push({
      id: "OpenAI",
      name: "OpenAI",
      keywords: "openai",
      subtitle: "Add a module to your workflow",
      section: "Nodes",
      icon: <Icons.component className={"text-muted-foreground mr-2"} />,
    });
    res.push(
      ...(nodes
        .filter((n) => n.nodeType !== "ModuleNode")
        .filter((n) => n.nodeType !== "Replicate")
        .map((node) => ({
          id: node.nodeType,
          name: node.label,
          parent: node.section,
          subtitle: node.description,
          section: node.section ?? "Nodes",
          perform: async () => {
            await di?.addNode(node.nodeType as NodeTypes);
          },
          icon: node.icon as any,
        })) as Action[]),
    );
    res.push({
      id: "ModuleNode",
      name: "Module",
      keywords: "module",
      subtitle: "Add a module to your workflow",
      section: "Nodes",
      icon: <Icons.component className={"text-muted-foreground mr-2"} />,
    });
    res.push({
      id: "replicate",
      name: "Replicate",
      keywords: "replicate",
      section: "Nodes",
      subtitle: "Add a model from Replicate",
      icon: <Icons.replicate className={"text-muted-foreground mr-2"} />,
    });
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
    return res;
  }, [nodes]);

  const [q, _setQuery] = useState<string | undefined>(undefined);
  const setQuery = debounce(_setQuery, 250, { maxWait: 600 });
  const [p, _setProject] = useState<string | undefined>(undefined);
  const setProject = debounce(_setProject, 250, { maxWait: 600 });
  const [w, _setWorkflow] = useState<string | undefined>(undefined);
  const setWorkflow = debounce(_setWorkflow, 250, { maxWait: 600 });
  const [replicate_collection_slug, _setReplicateCollection] = useState<
    string | undefined
  >(undefined);
  const setReplicateCollection = debounce(_setReplicateCollection, 250, {
    maxWait: 600,
  });

  function extractOwnerAndNameAndVersion(
    input: string,
  ): { owner: string; name: string; version: string } | null {
    const regex = /(?<owner>[\w\-]+)\/(?<name>[\w\-]+):(?<version>[\w\-]+)/;
    const match = input.match(regex);

    if (match && match.groups) {
      return {
        owner: match.groups.owner!,
        name: match.groups.name!,
        version: match.groups.version!,
      };
    } else {
      return null; // or handle the case where the input doesn't match the pattern
    }
  }
  function extractOwnerAndName(
    input: string,
  ): { owner: string; name: string } | null {
    const regex = /(?<owner>[\w\-]+)\/(?<name>[\w\-]+)/;
    const match = input.match(regex);

    if (match && match.groups) {
      return {
        owner: match.groups.owner!,
        name: match.groups.name!,
      };
    } else {
      return null; // or handle the case where the input doesn't match the pattern
    }
  }

  const { options, query, currentRootActionId, replicateModel } = useKBar(
    (state) => {
      if (state.currentRootActionId === "ModuleNode") {
        setQuery(state.searchQuery);
      }
      if (state.currentRootActionId?.startsWith("project_")) {
        setProject(state.currentRootActionId);
      }
      if (state.currentRootActionId?.startsWith("workflow_")) {
        setWorkflow(state.currentRootActionId);
      }
      if (state.currentRootActionId?.startsWith("replicate-collection-")) {
        setReplicateCollection(
          state.currentRootActionId.replace("replicate-collection-", ""),
        );
      }
      let replicateModel: { owner: string; name: string } | null = null;

      if (state.currentRootActionId?.startsWith("replicate-model-")) {
        console.log("replicate-model-", { state });
        const [owner, name] = state.currentRootActionId
          .replace("replicate-model-", "")
          .split("/");

        if (owner && name) {
          console.log(
            "setting replicate-model-",
            { owner, name },
            replicateModel,
          );
          // setReplicateModel({ owner, name });
          replicateModel = { owner, name };
        }
      }

      if (
        state.currentRootActionId === "replicate" &&
        extractOwnerAndName(state.searchQuery)
      ) {
        const { owner, name } = extractOwnerAndName(state.searchQuery)!;
        // setReplicateModel({ owner, name });
        replicateModel = { owner, name };
      }
      if (
        state.currentRootActionId === "replicate" &&
        extractOwnerAndNameAndVersion(state.searchQuery)
      ) {
      }

      return {
        currentRootActionId: state.currentRootActionId,
        replicateModel,
      };
    },
  );

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

  const { data: replicateCollections } = api.replicate.getCollections.useQuery(
    {},
    { enabled: currentRootActionId === "replicate", keepPreviousData: true },
  );

  const replicateActions = useMemo<Action[]>(() => {
    return (
      replicateCollections?.results.map(
        (collection) =>
          ({
            id: `replicate-collection-${collection.slug}`,
            name: collection.name,
            parent: "replicate",
            icon: <Icons.replicate className={"text-muted-foreground mr-2"} />,
            section: "Replicate",
            subtitle: collection.description,
          }) as Action,
      ) || []
    );
  }, [replicateCollections]);

  const { data: replicateCollection } = api.replicate.getCollection.useQuery(
    {
      collection_slug: replicate_collection_slug!,
    },
    {
      enabled: !!replicate_collection_slug,
      keepPreviousData: true,
    },
  );

  const replicateModelActions = useMemo<Action[]>(() => {
    if (!replicateCollection?.models) return [];
    return (
      flatten(
        replicateCollection?.models.map((model) => [
          {
            id: `replicate-model-${model.owner}/${model.name}`,
            name: `${model?.owner}/${model?.name}`,
            parent: `replicate-collection-${replicateCollection?.slug}`,
            icon: <Icons.replicate className={"text-muted-foreground mr-2"} />,
            section: `Replicate | ${replicateCollection?.name}`,
            subtitle: model.description,
          } as Action,
          {
            id: `replicate-model-${model.owner}/${model.name}:${model.latest_version?.id}`,
            name: `v ${model.latest_version?.id.substring(0, 8)}`,
            parent: `replicate-model-${model.owner}/${model.name}`,
            icon: <Icons.replicate className={"text-muted-foreground mr-2"} />,
            section: `Replicate | ${model.owner} | ${model.name}`,
            subtitle: `created at: ${
              model.latest_version?.created_at &&
              formatDistance(
                new Date(model.latest_version?.created_at),
                new Date(),
                {
                  addSuffix: true,
                },
              )
            }`,
            perform: async () => {
              await di?.addNode(
                "Replicate",
                {
                  settings: {
                    model_name: model?.name,
                    owner: model?.owner,
                    version_id: model.latest_version?.id,
                  },
                },
                {
                  label: `${model?.owner}/${model?.name}`,
                },
              );
            },
          } as Action,
        ]),
      ) || []
    );
  }, [replicateCollection]);

  const { data: replicateModelVersions } = api.replicate.versions.useQuery(
    {
      owner: replicateModel?.owner!,
      model_name: replicateModel?.name!,
    },
    {
      enabled: !isNil(replicateModel?.name) && !isNil(replicateModel?.owner),
      keepPreviousData: true,
    },
  );

  const replicateModelVersionActions = useMemo<Action[]>(() => {
    if (!replicateModel) {
      return [];
    }
    // console.log("replicateModelVersions", replicateModelVersions);
    const actions: Action[] = [];
    replicateModelVersions?.results
      ?.filter(
        // filter out versions that are already in the list
        (version) =>
          !replicateModelActions.find(
            (a) =>
              a.id ===
              `replicate-model-${replicateModel?.owner}/${replicateModel?.name}:${version.id}`,
          ),
      )
      .map((version) => {
        if (
          // add the model to the list if it's not already there
          !replicateModelActions.find(
            (a) =>
              a.id ===
              `replicate-model-${replicateModel?.owner}/${replicateModel?.name}`,
          ) &&
          !actions.find(
            (a) =>
              a.id ===
              `replicate-model-${replicateModel?.owner}/${replicateModel?.name}`,
          )
        ) {
          actions.push({
            id: `replicate-model-${replicateModel?.owner}/${replicateModel?.name}`,
            name: `${replicateModel?.owner}/${replicateModel?.name}`,
            parent: "replicate",
            icon: <Icons.replicate className={"text-muted-foreground mr-2"} />,
            section: `Replicate | ${replicateModel?.owner}`,
          } as Action);
        }

        actions.push({
          id: `replicate-model-${replicateModel?.owner}/${replicateModel?.name}:${version.id}`,
          name: `v ${version.id.substring(0, 8)}`,
          parent: `replicate-model-${replicateModel?.owner}/${replicateModel?.name}`,
          icon: <Icons.replicate className={"text-muted-foreground mr-2"} />,
          section: `Replicate | ${replicateModel?.owner} | ${replicateModel?.name}`,
          subtitle: `created at: ${formatDistance(
            new Date(version.created_at),
            new Date(),
            {
              addSuffix: true,
            },
          )}`,
          perform: async () => {
            await di?.addNode("Replicate", {
              settings: {
                model_name: replicateModel?.name,
                owner: replicateModel?.owner,
                version_id: version.id,
              },
            });
          },
        } as Action);
        return actions;
      });
    return actions;
  }, [replicateModelVersions, replicateModel]);

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
      ...replicateActions,
      ...replicateModelActions,
      ...replicateModelVersionActions,
    ].filter(Boolean),
    [
      actions,
      moduleActions,
      orgActions,
      workflowActions,
      assistantActions,
      replicateActions,
      replicateModelActions,
      replicateModelVersionActions,
    ],
  );
};
