"use client";

import { v4 as uuidv4 } from "uuid";
import { Editor } from "@/components/editor";
import { useState } from "react";
import useSWR from "swr";
import { getArticle, updateArticle } from "../../actions";
import { usePlateEditorState } from "@udecode/plate-common";
import { Button } from "@/components/ui/button";

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
  const handleSave = async () => {
    const res = await updateArticle({
      id: article.id,
      slug: article.slug,
      title: article.title,
      nodes: val,
    });
  };
  return (
    <>
      <Button onClick={handleSave}>Save</Button>
      <Editor
        initialValue={
          data?.nodes?.length && data.nodes.length > 0
            ? data?.nodes
            : initialValue
        }
        onChange={(v) => setVal(v)}
      />
    </>
  );
};
