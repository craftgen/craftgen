"use client";

import { v4 as uuidv4 } from "uuid";
import { Editor } from "@/components/editor";
import { useState } from "react";
import useSWR from "swr";
import { getArticle, updateArticle } from "../../actions";
import { usePlateEditorState } from "@udecode/plate-common";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

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
    <>
      <Editor
        id={article.id}
        initialValue={
          data?.nodes?.length && data.nodes.length > 0
            ? data?.nodes.map((node) => node.data)
            : initialValue
        }
        onChange={(v) => setVal(v)}
      />
    </>
  );
};
