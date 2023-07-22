import { Button } from "@/components/ui/button";
import { createPlayground, getProject, getSomething } from "./actions";
import { Metrics } from "./metrics";
import { PlaygroundList } from "./playground-list";
import { useRouter } from "next/navigation";

const ProjectPage = async ({
  params,
}: {
  params: {
    projectSlug: string;
  };
}) => {
  const project = await getProject(params.projectSlug);
  const metrics = await getSomething({ siteUrl: project?.site! });
  return (
    <div className="p-10">
      <h1 className="text-3xl p-2 leading-tight">{project?.name}</h1>
      <Metrics metrics={metrics} />
      <section>
        <PlaygroundList projectId={project?.id!} />
      </section>
    </div>
  );
};

export default ProjectPage;
