import { Button } from "@/components/ui/button";
import {
  createPlayground,
  getProject,
  getAnalytics,
  getSearchQueries,
} from "./actions";
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
  const metrics = await getAnalytics({ siteUrl: project?.site! });
  // const queries = await getSearchQueries({ siteUrl: project?.site! });
  return (
    <div className="p-10">
      <h1 className="text-3xl p-2 leading-tight">{project?.name}</h1>
      {metrics && <Metrics metrics={metrics} />}
      <section>
        <PlaygroundList projectId={project?.id!} />
      </section>
    </div>
  );
};

export default ProjectPage;
