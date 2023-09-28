import type { Metadata, ResolvingMetadata } from "next";

import { getPlayground, getPlaygroundVersions } from "../../action";
import Link from "next/link";

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
  const { data: playground } = await getPlayground({
    projectSlug: params.projectSlug,
    playgroundSlug: params.playgroundSlug,
  });

  return {
    title: `${playground?.name} | ${playground?.project.name}`,
  };
}

const PlaygroundVersionsPage: React.FC<Props> = async (props) => {
  const { data: playgroundVersions } = await getPlaygroundVersions({
    projectSlug: props.params.projectSlug,
    playgroundSlug: props.params.playgroundSlug,
  });
  return (
    <div className="h-full flex flex-col">
      <section className="grid grid-cols-1 divide-y ">
        {playgroundVersions?.map((version) => (
          <div className="p-2" key={version.id}>
            <Link
              href={`/${props.params.projectSlug}/${version.slug}/versions/${version.version}`}
            >
              <h2 className="text-mono">v{version.version}</h2>
            </Link>
            <p className="text-muted-foreground">{version.changeLog}</p>
          </div>
        ))}
      </section>
    </div>
  );
};

export default PlaygroundVersionsPage;
