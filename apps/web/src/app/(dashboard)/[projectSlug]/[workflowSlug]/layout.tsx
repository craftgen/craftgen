import Link from "next/link";
import { notFound } from "next/navigation";

import { WorkflowLayout } from "@craftgen/ui/layout/workflow";
import { ModuleHeader } from "@craftgen/ui/views/module-header";

import { api } from "@/trpc/server";

import { WorkflowTabs } from "./tabs";

const PlaygroundLayout = async (props: {
  params: {
    projectSlug: string;
    workflowSlug: string;
  };
  children: React.ReactNode;
}) => {
  const workflow = await api.craft.module.meta({
    projectSlug: props.params.projectSlug,
    workflowSlug: props.params.workflowSlug,
  });
  if (!workflow) return notFound();
  const moduleId = `${workflow.project.slug}/${workflow.slug}`;

  return (
    <WorkflowLayout>
      <ModuleHeader workflow={workflow} moduleId={moduleId} Link={Link} />
      <WorkflowTabs moduleId={moduleId} />
      {props.children}
    </WorkflowLayout>
  );
};

export default PlaygroundLayout;
