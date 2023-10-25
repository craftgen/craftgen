import { mock } from "bun:test";

export const mockAPI = {
  setContext: mock(async (params: any) => {}),
  checkAPIKeyExist: mock(async (params: any) => {
    return true;
  }),
  getAPIKey: mock(async (params: any) => {
    return "";
  }),
  updateExecutionNode: mock(async (params: any) => {}),
  triggerWorkflowExecutionStep: mock(async (params: any) => {}),
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
