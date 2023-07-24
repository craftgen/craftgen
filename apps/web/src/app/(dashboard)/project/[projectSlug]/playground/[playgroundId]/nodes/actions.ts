"use server";

import { db, eq, nodeData } from "@turboseo/supabase/db";

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
