'use server';

import { db } from "@turboseo/supabase/db";

export const getDataSets = async (projectId: string) => {
  return await db.query.dataSet.findMany({
    where: (dataSet, { eq }) => eq(dataSet.project_id, projectId),
  });
}

export const getDataSet = async (dataSetId: string) => {
  return await db.query.dataSet.findFirst({
    where: (dataSet, { eq }) => eq(dataSet.id, dataSetId),
  });
}

export const getNodeData = async (nodeId: string) => {
  return await db.query.nodeData.findFirst({
    where: (nodeData, { eq }) => eq(nodeData.id, nodeId),
  });
}

