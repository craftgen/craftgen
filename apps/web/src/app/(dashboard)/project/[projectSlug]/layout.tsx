import { PropsWithChildren } from "react";

import { ProjectNavbar } from "./project-navbar";

const ProjectLayout: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <>
      <ProjectNavbar />
      {children}
    </>
  );
};

export default ProjectLayout;
