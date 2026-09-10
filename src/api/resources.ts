import { api } from "./client.js";
import type {
  ClientRecord,
  TrackerRecord,
  RequirementRecord,
  LinkedWorkItemRecord,
  FigmaReferenceRecord,
  ReleaseNoteRecord,
  ReleaseNoteStatus,
  StageRecord,
  WorkflowRecord,
  WorkflowScope,
  SyncRunResult,
} from "./types.js";

export const clientsApi = {
  list: () => api.get<ClientRecord[]>("/clients"),
  get: (id: string) => api.get<ClientRecord & { trackers: TrackerRecord[] }>(`/clients/${id}`),
  create: (data: Partial<ClientRecord> & { name: string; adoPat?: string; cloneRequirementWorkflowFrom?: string }) =>
    api.post<ClientRecord>("/clients", data),
  update: (id: string, data: Partial<ClientRecord> & { adoPat?: string }) =>
    api.patch<ClientRecord>(`/clients/${id}`, data),
  moveStage: (id: string, stageId: string) => api.patch<ClientRecord>(`/clients/${id}/stage`, { stageId }),
  remove: (id: string) => api.delete<void>(`/clients/${id}`),
};

export const trackersApi = {
  listForClient: (clientId: string) => api.get<TrackerRecord[]>(`/clients/${clientId}/trackers`),
  create: (clientId: string, name: string) =>
    api.post<TrackerRecord>(`/clients/${clientId}/trackers`, { name }),
  get: (id: string) => api.get<TrackerRecord & { client: ClientRecord }>(`/trackers/${id}`),
  remove: (id: string) => api.delete<void>(`/trackers/${id}`),
};

export const requirementsApi = {
  listForTracker: (trackerId: string) =>
    api.get<RequirementRecord[]>(`/trackers/${trackerId}/requirements`),
  create: (trackerId: string, data: { title: string; description?: string; dueDate?: string }) =>
    api.post<RequirementRecord>(`/trackers/${trackerId}/requirements`, data),
  get: (id: string) => api.get<RequirementRecord>(`/requirements/${id}`),
  update: (id: string, data: { title?: string; description?: string; dueDate?: string | null }) =>
    api.patch<RequirementRecord>(`/requirements/${id}`, data),
  moveStage: (id: string, stageId: string) =>
    api.patch<RequirementRecord & { releaseNoteWarning: string | null }>(`/requirements/${id}/stage`, { stageId }),
  remove: (id: string) => api.delete<void>(`/requirements/${id}`),
  linkExisting: (requirementId: string, adoId: number) =>
    api.post<LinkedWorkItemRecord>(`/requirements/${requirementId}/linked-work-items`, { adoId }),
  createInAdo: (requirementId: string, data: { title: string; description?: string; workItemType?: string }) =>
    api.post<LinkedWorkItemRecord>(`/requirements/${requirementId}/linked-work-items`, data),
  unlink: (requirementId: string, linkedId: string) =>
    api.delete<void>(`/requirements/${requirementId}/linked-work-items/${linkedId}`),
  attachFigmaLink: (requirementId: string, url: string) =>
    api.post<FigmaReferenceRecord>(`/requirements/${requirementId}/figma-links`, { url }),
  removeFigmaLink: (requirementId: string, referenceId: string) =>
    api.delete<void>(`/requirements/${requirementId}/figma-links/${referenceId}`),
};

export const releaseNotesApi = {
  list: (status?: ReleaseNoteStatus) =>
    api.get<ReleaseNoteRecord[]>(`/release-notes${status ? `?status=${status}` : ""}`),
  get: (id: string) => api.get<ReleaseNoteRecord>(`/release-notes/${id}`),
  update: (id: string, data: Partial<ReleaseNoteRecord>) =>
    api.patch<ReleaseNoteRecord>(`/release-notes/${id}`, data),
  approve: (id: string) => api.post<ReleaseNoteRecord>(`/release-notes/${id}/approve`),
  send: (id: string) => api.post<ReleaseNoteRecord>(`/release-notes/${id}/send`),
};

export const syncApi = {
  runNow: () => api.post<SyncRunResult>("/sync/run"),
  history: () => api.get<SyncRunResult[]>("/sync/runs"),
};

export const stagesApi = {
  list: () => api.get<StageRecord[]>("/stages"),
  create: (data: { name: string; color?: string; isDoneStage?: boolean }) =>
    api.post<StageRecord>("/stages", data),
  update: (id: string, data: { name?: string; color?: string; isDoneStage?: boolean }) =>
    api.patch<StageRecord>(`/stages/${id}`, data),
  remove: (id: string) => api.delete<void>(`/stages/${id}`),
};

export const workflowsApi = {
  list: (scope?: WorkflowScope) => api.get<WorkflowRecord[]>(`/workflows${scope ? `?scope=${scope}` : ""}`),
  get: (id: string) => api.get<WorkflowRecord>(`/workflows/${id}`),
  clone: (id: string, data: { name: string; ownerClientId?: string; isTemplate?: boolean }) =>
    api.post<WorkflowRecord>(`/workflows/${id}/clone`, data),
  addStage: (id: string, data: { stageId: string; position?: number }) =>
    api.post(`/workflows/${id}/stages`, data),
  removeStage: (id: string, workflowStageId: string) =>
    api.delete<void>(`/workflows/${id}/stages/${workflowStageId}`),
  reorderStages: (id: string, orderedWorkflowStageIds: string[]) =>
    api.put<WorkflowRecord>(`/workflows/${id}/stages/reorder`, { orderedWorkflowStageIds }),
};
