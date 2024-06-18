import { createFileRoute } from "@tanstack/react-router";

import { RouterOutputs } from "@craftgen/api";
import { useHeadlessEditor } from "@craftgen/composer/editor";
import {
  InputsList,
  OutputList,
} from "@craftgen/composer/ui/control/control-node";
import { WorkflowLayout } from "@craftgen/ui/layout/workflow";

import { api, client } from "../trpc/react";

const ProjectPage = () => {
  const initial = Route.useLoaderData();
  const params = Route.useParams();
  const { data: module } = api.craft.module.meta.useQuery(
    {
      projectSlug: params.projectSlug,
      workflowSlug: params.workflowSlug,
    },
    {
      initialData: initial.module,
    },
  );

  const { data: workflow } = api.craft.module.get.useQuery(
    {
      projectSlug: params.projectSlug,
      workflowSlug: params.workflowSlug,
      version: module?.version?.version,
      executionId: module?.execution?.id,
    },
    {
      initialData: initial.workflow,
    },
  );

  return (
    <WorkflowLayout.Content>
      <WorkflowInput workflow={workflow} />
    </WorkflowLayout.Content>
  );
};

export const WorkflowInput = (props: {
  workflow: RouterOutputs["craft"]["module"]["get"];
}) => {
  const utils = api.useUtils();
  const { editor } = useHeadlessEditor({
    workflow: props.workflow,
    api: {
      trpc: utils.client,
    },
  });

  return (
    <div className="grid grid-cols-2 gap-4">
      {editor?.actor && <InputsList actor={editor.actor} />}
      {editor?.actor && <OutputList actor={editor.actor} />}
    </div>
  );
};

export const Route = createFileRoute("/_workflow/$projectSlug/$workflowSlug/")({
  loader: async ({ params: { projectSlug, workflowSlug } }) => {
    const module = await client.craft.module.meta.query({
      workflowSlug: workflowSlug,
      projectSlug: projectSlug,
    });
    const workflow = await client.craft.module.get.query({
      workflowSlug: workflowSlug,
      projectSlug: projectSlug,
      version: module?.version?.version,
      executionId: module?.execution?.id,
    });
    return { module, workflow };
  },
  component: ProjectPage,
});
