import type { Metadata, ResolvingMetadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTRPCErrorFromUnknown } from "@trpc/server";

import { db } from "@craftgen/db/db";

import { api } from "@/trpc/server";

import { Editor } from "./editor";

export const dynamicParams = true;
export const revalidate = 300;

interface Props {
  params: {
    projectSlug: string;
    workflowSlug: string;
  };
  searchParams: Record<string, string | string[] | undefined>;
}

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  try {
    const workflowMeta = await api.platform.craft.module.meta({
      orgSlug: params.projectSlug,
      workflowSlug: params.workflowSlug,
    });

    return {
      title: `${workflowMeta?.name} | ${workflowMeta?.organization.name}`,
      description: workflowMeta?.description,
    };
  } catch (e: unknown) {
    console.log("ERROR", e);
    const error = getTRPCErrorFromUnknown(e);
    if (error.code === "NOT_FOUND") {
      notFound();
    } else if (error.code === "UNAUTHORIZED") {
      redirect(`/login?redirect=${params.projectSlug}/${params.workflowSlug}`);
    } else {
      console.log("ERROR", error);
      return new Response("Error", { status: 500 });
    }
  }
}

const PlaygroundPage: React.FC<Props> = async (props) => {
  try {
    const workflowMeta = await api.platform.craft.module.meta({
      as: props.params.projectSlug,
      workflowSlug: props.params.workflowSlug,
    });
    if (!workflowMeta) {
      notFound();
    }
    return (
      <div className="flex h-full flex-col">
        <Editor
          projectSlug={workflowMeta.organizationSlug}
          workflowSlug={workflowMeta.slug}
          version={workflowMeta.version?.version!}
          executionId={props.searchParams.execution as string}
        />
      </div>
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

export default PlaygroundPage;
