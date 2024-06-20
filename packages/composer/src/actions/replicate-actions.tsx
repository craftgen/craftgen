import { useEffect, useMemo, useState } from "react";
import { formatDistance } from "date-fns";
import * as FlexLayout from "flexlayout-react";
import { Action, useKBar, useRegisterActions, VisualState } from "kbar";
import { debounce, flatten, isNil } from "lodash-es";

import type { Editor } from "@craftgen/core/editor";
import { Icons } from "@craftgen/ui/components/icons";
import { toast } from "@craftgen/ui/components/use-toast";
import { api } from "@craftgen/ui/lib/api";

import { extractOwnerAndName, extractOwnerAndNameAndVersion } from "./utils";

export const useRegisterReplicateActions = ({
  di,
  layout,
}: {
  di: Editor | null;
  layout: FlexLayout.Model;
}) => {
  const { data: hasReplicateKey } = api.credentials.hasKeyForProvider.useQuery(
    {
      projectId: di?.projectId!,
      provider: "REPLICATE",
    },
    {
      enabled: !!di?.projectId,
      keepPreviousData: false,
    },
  );

  const [q, _setQuery] = useState<string | undefined>(undefined);
  const setQuery = debounce(_setQuery, 250, { maxWait: 600 });
  const [replicate_collection_slug, _setReplicateCollection] = useState<
    string | undefined
  >(undefined);
  const setReplicateCollection = debounce(_setReplicateCollection, 250, {
    maxWait: 600,
  });

  const { options, query, currentRootActionId, replicateModel } = useKBar(
    (state) => {
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
          replicateModel = { owner, name };
        }
      }

      if (
        state.currentRootActionId === "replicate" &&
        extractOwnerAndName(state.searchQuery)
      ) {
        const { owner, name } = extractOwnerAndName(state.searchQuery)!;
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
  const actions = useMemo(() => {
    const res = [];
    res.push({
      id: "replicate",
      name: "Replicate",
      keywords: "replicate",
      section: "Nodes",
      subtitle: "Add a model from Replicate",
      icon: <Icons.replicate className={"mr-2 text-muted-foreground"} />,
    });
    return res;
  }, [hasReplicateKey]);

  useEffect(() => {
    if (currentRootActionId === "replicate" && !hasReplicateKey) {
      toast("You need to add a Replicate API key first", {
        action: {
          label: "Add API key",
          onClick: async () => {
            layout.doAction(FlexLayout.Actions.selectTab("credentials"));
          },
        },
      });
      query.setVisualState((state) => VisualState.animatingOut);
    }
  }, [currentRootActionId, hasReplicateKey]);

  const replicateCollections = api.replicate.getCollections.useQuery(
    {},
    { enabled: currentRootActionId === "replicate", keepPreviousData: true },
  );

  const replicateActions = useMemo<Action[]>(() => {
    if (replicateCollections.error) {
      return [
        {
          id: "replicate-error",
          name: "Error loading Replicate",
          parent: "replicate",
          icon: <Icons.replicate className={"mr-2 text-muted-foreground"} />,
          section: "Replicate",
          subtitle: replicateCollections.error.message,
        },
      ];
    }
    return (
      replicateCollections.data?.results.map(
        (collection) =>
          ({
            id: `replicate-collection-${collection.slug}`,
            name: collection.name,
            parent: "replicate",
            icon: <Icons.replicate className={"mr-2 text-muted-foreground"} />,
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
        replicateCollection?.models
          .toSorted((a, b) => b.run_count - a.run_count)
          .map((model) => [
            {
              id: `replicate-model-${model.owner}/${model.name}`,
              name: `${model?.owner}/${model?.name}`,
              parent: `replicate-collection-${replicateCollection?.slug}`,
              icon: (
                <Icons.replicate className={"mr-2 text-muted-foreground"} />
              ),
              section: `Replicate | ${replicateCollection?.name}`,
              subtitle: model.description,
            } as Action,
            {
              id: `replicate-model-${model.owner}/${model.name}:${model.latest_version?.id}`,
              name: `v ${model.latest_version?.id.substring(0, 8)}`,
              parent: `replicate-model-${model.owner}/${model.name}`,
              icon: (
                <Icons.replicate className={"mr-2 text-muted-foreground"} />
              ),
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
                  "NodeReplicate",
                  {
                    settings: {
                      model: {
                        model_name: model?.name,
                        owner: model?.owner,
                        description: model?.description,
                        version_id: model.latest_version?.id,
                      },
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
            icon: <Icons.replicate className={"mr-2 text-muted-foreground"} />,
            section: `Replicate | ${replicateModel?.owner}`,
          } as Action);
        }

        actions.push({
          id: `replicate-model-${replicateModel?.owner}/${replicateModel?.name}:${version.id}`,
          name: `v ${version.id.substring(0, 8)}`,
          parent: `replicate-model-${replicateModel?.owner}/${replicateModel?.name}`,
          icon: <Icons.replicate className={"mr-2 text-muted-foreground"} />,
          section: `Replicate | ${replicateModel?.owner} | ${replicateModel?.name}`,
          subtitle: `created at: ${formatDistance(
            new Date(version.created_at),
            new Date(),
            {
              addSuffix: true,
            },
          )}`,
          perform: async () => {
            await di?.addNode("NodeReplicate", {
              settings: {
                model: {
                  model_name: replicateModel?.name,
                  owner: replicateModel?.owner,
                  version_id: version.id,
                },
              },
            });
          },
        } as Action);
        return actions;
      });
    return actions;
  }, [replicateModelVersions, replicateModel]);

  useRegisterActions(
    [
      ...actions,
      ...replicateActions,
      ...replicateModelActions,
      ...replicateModelVersionActions,
    ].filter(Boolean),
    [
      actions,
      replicateActions,
      replicateModelActions,
      replicateModelVersionActions,
    ],
  );
};
