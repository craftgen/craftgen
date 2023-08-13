import { getArticles, getProject } from "../actions";
import { ArticleList } from "./article-list";

const ArticlesPage = async ({
  params,
}: {
  params: {
    projectSlug: string;
  };
}) => {
  const project = await getProject(params.projectSlug as string);
  const articles = await getArticles({ projectId: project?.id! });
  console.log(articles);
  return (
    <div className="flex flex-col items-center">
      Articles
      <pre>
        <code>{JSON.stringify(articles, null, 2)}</code>
      </pre>
      <div className="max-w-6xl w-full">
        <ArticleList articles={articles} projectId={project?.id!} />
      </div>
    </div>
  );
};

export default ArticlesPage;
