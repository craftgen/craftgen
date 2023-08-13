import { getArticle, getProject } from "../../actions";
import { ArticleEditor } from "./article-editor";

const ArticlePage = async ({ params }: { params: any }) => {
  const project = await getProject(params.projectSlug as string);
  const article = await getArticle({
    projectId: project!.id,
    articleSlug: params.articleSlug as string[],
  });
  return (
    <div className="bg-red-400">
      <ArticleEditor
        projectId={project!.id}
        articleSlug={params.articleSlug}
        article={article!}
      />
    </div>
  );
};

export default ArticlePage;
