import { getProject, getSomething } from "./actions";
import { Metrics } from "./metrics";

const ProjectPage = async ({
  params,
}: {
  params: {
    projectId: string;
  };
}) => {
  const project = await getProject(params.projectId);
  const metrics = await getSomething({ siteUrl: project?.site! });
  return (
    <div className="p-10">
      <h1 className="text-3xl p-2 leading-tight">{project?.name}</h1>
      <Metrics metrics={metrics} />
    </div>
  );
};

export default ProjectPage;
