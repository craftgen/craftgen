"use server";

import {
  and,
  dataRow,
  db,
  eq,
  gt,
  nodeData,
  dataSet,
} from "@turboseo/supabase/db";

export const getDataSets = async (projectId: string) => {
  console.log({ projectId });
  return await db.query.dataSet.findMany({
    where: (dataSet, { eq }) => eq(dataSet.project_id, projectId),
  });
};

export const getDataSet = async (dataSetId: string) => {
  try {
    return await db.query.dataSet.findFirst({
      where: (dataSet, { eq }) => eq(dataSet.id, dataSetId),
      with: {
        rows: true,
      },
    });
  } catch (err) {
    console.log(err);
  }
};

export const getDatasetPaginated = async (params: {
  datasetId: string;
  cursor?: string;
  limit?: number;
}) => {
  const cursorCondition = params.cursor
    ? gt(dataRow.id, params.cursor)
    : undefined;
  console.log(cursorCondition);
  const data = await db
    .select()
    .from(dataRow)
    .where(and(eq(dataRow.data_set_id, params.datasetId), cursorCondition))
    .orderBy(dataRow.id)
    .limit(params?.limit || 10);

  return {
    data,
    nextCursor: data[data.length - 1]?.id,
  };
};

export const getNodeData = async (nodeId: string) => {
  console.log({ nodeId });

  return await db.query.nodeData.findFirst({
    where: (nodeData, { eq }) => eq(nodeData.id, nodeId),
  });
};

export const setNodeData = async (nodeId: string, state: any) => {
  return await db
    .update(nodeData)
    .set({ state: JSON.parse(state) })
    .where(eq(nodeData.id, nodeId));
};
