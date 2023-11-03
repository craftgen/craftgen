import { getAnalytics, getProject } from "./actions";
import { Metrics } from "./metrics";
import { PlaygroundList } from "./playground-list";

const ProjectPage = async ({
  params,
}: {
  params: {
    projectSlug: string;
  };
}) => {
  const project = await getProject(params.projectSlug);
  const metrics = project?.site
    ? await getAnalytics({ siteUrl: project?.site })
    : undefined;
  return (
    <div className="p-10">
      <h1 className="p-2 text-3xl leading-tight">{project?.name}</h1>
      {metrics && <Metrics metrics={metrics} />}
      <section>
        <PlaygroundList projectId={project?.id!} />
      </section>
    </div>
  );
};

export default ProjectPage;
