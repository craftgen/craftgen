import type { Metadata, ResolvingMetadata } from "next";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { api } from "@/trpc/server";

type Props = {
  params: {
    projectSlug: string;
    playgroundSlug: string;
  };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const workflowMeta  = await api.craft.module.meta.query({
    projectSlug: params.projectSlug,
    workflowSlug: params.playgroundSlug,
  });

  return {
    title: `${workflowMeta?.name} | ${workflowMeta?.project.name}`,
  };
}

const PlaygroundVersionsPage: React.FC<Props> = async (props) => {
  const workflowMeta  = await api.craft.module.meta.query({
    projectSlug: props.params.projectSlug,
    workflowSlug: props.params.playgroundSlug,
  });
  const versions  = await api.craft.version.list.query({
    workflowId: workflowMeta.id,
  })
  return (
    <div className="h-full flex flex-col">
      <section className="grid grid-cols-1 divide-y ">
        {versions.map((version) => (
          <div className="p-2" key={version.id}>
            <div className="flex">
              <Link
                href={`/${version.workflow.projectSlug}/${version.workflow.slug}/versions/${version.version}`}
              >
                <h2 className="text-mono">v{version.version}</h2>
              </Link>
              {!version.publishedAt && (
                <Badge variant={"outline"}>Canary</Badge>
              )}
            </div>
            <p className="text-muted-foreground">{version.changeLog}</p>
          </div>
        ))}
      </section>
    </div>
  );
};

export default PlaygroundVersionsPage;
