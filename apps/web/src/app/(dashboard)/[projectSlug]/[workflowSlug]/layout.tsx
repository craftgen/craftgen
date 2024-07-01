import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTRPCErrorFromUnknown } from "@trpc/server";

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
  try {
    const workflow = await api.craft.module.meta({
      projectSlug: props.params.projectSlug,
      workflowSlug: props.params.workflowSlug,
    });
    const moduleId = `${workflow.project.slug}/${workflow.slug}`;

    return (
      <WorkflowLayout>
        <ModuleHeader workflow={workflow} moduleId={moduleId} Link={Link} />
        <WorkflowTabs moduleId={moduleId} />
        {props.children}
      </WorkflowLayout>
    );
  } catch (e: unknown) {
    const error = getTRPCErrorFromUnknown(e);
    if (error.code === "NOT_FOUND") {
      notFound();
    } else if (error.code === "UNAUTHORIZED") {
      redirect(
        `/login?redirect=${props.params.projectSlug}/${props.params.workflowSlug}`,
      );
    } else {
      console.log("ERROR", error);
      return <div>Error</div>;
    }
  }
};

export default PlaygroundLayout;
