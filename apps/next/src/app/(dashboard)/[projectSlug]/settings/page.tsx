import { ProjectSettingsSection } from "./project-settings";

const ProjectSettingPage = ({
  params,
}: {
  params: { projectSlug: string };
}) => {
  return (
    <div>
      <ProjectSettingsSection projectSlug={params.projectSlug} />
    </div>
  );
};

export default ProjectSettingPage;
