import { mock } from "bun:test";

import type { WorkflowAPI } from "../types";

export const mockAPI: WorkflowAPI = {
  setContext: mock(async (params: any) => {}),
  checkAPIKeyExist: mock(async (params: any) => {
    return true;
  }),
  getAPIKey: mock(async (params: any) => {
    return "";
  }),
  createExecution: mock(async (params: any) => {
    return { id: "execution_id" };
  }),
  upsertNode: mock(async (params: any) => {}),
  deleteNode: mock(async (params: any) => {}),
  deleteEdge: mock(async (params: any) => {}),
  saveEdge: mock(async (params: any) => {}),
  setState: mock(async (params: any) => {}),
  triggerWorkflowExecutionStep: mock(async (params: any) => {}),
  updateNodeMetadata: mock(async function (params: {
    id: string;
    position?: { x: number; y: number } | undefined;
    size?: { width: number; height: number } | undefined;
    label?: string | undefined;
  }): Promise<void> {
    // throw new Error("Function not implemented.");
  }),
};

export const nodeAreaDefaults = {
  color: "#fff",
  height: 100,
  width: 100,
  projectId: "projectId",
  workflowId: "workflowId",
  workflowVersionId: "workflowVersionId",
  contextId: "contextId",
  position: { x: 0, y: 0 },
  label: "label",
};
