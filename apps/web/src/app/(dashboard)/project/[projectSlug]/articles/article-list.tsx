"use client";

import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import { getArticles } from "../actions";
import useSWR from "swr";

export const ArticleList: React.FC<{ articles: any[]; projectId: string }> = ({
  articles,
  projectId,
}) => {
  const { data, isLoading } = useSWR(
    `/api/articles/${projectId}`,
    () => getArticles({ projectId }),
    {
      fallbackData: articles,
    }
  );
  return (
    <div className="w-full">
      <DataTable data={data} columns={columns} />
    </div>
  );
};
