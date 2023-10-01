import { getProject } from "../actions";

const ArticlesPage = async ({
  params,
}: {
  params: {
    projectSlug: string;
  };
}) => {
  const project = await getProject(params.projectSlug as string);
  return null;
};

export default ArticlesPage;
