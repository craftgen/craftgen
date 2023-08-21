"use client";

import { v4 as uuidv4 } from "uuid";
import { Editor } from "@/components/editor";
import { useState } from "react";
import useSWR from "swr";
import { getArticle } from "../../actions";

const initialValue = [
  {
    type: "h1",
    id: uuidv4(),
    children: [
      {
        text: "Awesome Article",
      },
    ],
  },
];

export const ArticleEditor: React.FC<{
  articleSlug: string[];
  projectId: string;
  article: NonNullable<Awaited<ReturnType<typeof getArticle>>>;
}> = ({ articleSlug, projectId, article }) => {
  const [val, setVal] = useState<any>();
  const { data } = useSWR(
    `/api/articles/${projectId}/${articleSlug}`,
    () =>
      getArticle({
        projectId,
        articleSlug,
      }),
    {
      fallbackData: article,
    }
  );
  return (
    <div className="h-[calc(100vh-5rem)]  flex flex-col relative">
      <Editor
        id={article.id}
        initialValue={
          data?.nodes?.length && data.nodes.length > 0
            ? data?.nodes.map((node) => node.data)
            : initialValue
        }
        onChange={(v) => setVal(v)}
      />
    </div>
  );
};
