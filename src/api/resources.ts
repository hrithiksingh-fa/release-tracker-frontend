import { api } from "./client.js";
import type {
  ClientRecord,
  PhaseRecord,
  RequirementRecord,
  LinkedWorkItemRecord,
  FigmaReferenceRecord,
  CommentRecord,
  ReleaseNoteRecord,
  ReleaseNoteStatus,
  StageRecord,
  WorkflowRecord,
  WorkflowScope,
  ModuleRecord,
  CategoryRecord,
  AuditLogRecord,
  TimelineNode,
  SyncRunResult,
} from "./types.js";

export const clientsApi = {
  list: () => api.get<ClientRecord[]>("/clients"),
  get: (id: string) => api.get<ClientRecord & { phases: PhaseRecord[] }>(`/clients/${id}`),
  create: (
    data: Partial<ClientRecord> & {
      name: string;
      adoPat?: string;
      moduleIds?: string[];
      clonePhaseWorkflowFrom?: string;
      cloneRequirementWorkflowFrom?: string;
    }
  ) => api.post<ClientRecord>("/clients", data),
  update: (id: string, data: Partial<ClientRecord> & { adoPat?: string; moduleIds?: string[] }) =>
    api.patch<ClientRecord>(`/clients/${id}`, data),
  moveStage: (id: string, stageId: string) => api.patch<ClientRecord>(`/clients/${id}/stage`, { stageId }),
  attachWorkflow: (id: string, scope: "PHASE" | "REQUIREMENT", workflowId: string) =>
    api.patch<ClientRecord>(`/clients/${id}/workflows`, { scope, workflowId }),
  remove: (id: string) => api.delete<void>(`/clients/${id}`),
};

export const phasesApi = {
  listForClient: (clientId: string) => api.get<PhaseRecord[]>(`/clients/${clientId}/phases`),
  create: (clientId: string, data: { name: string; description?: string; deliveryDate?: string }) =>
    api.post<PhaseRecord>(`/clients/${clientId}/phases`, data),
  get: (id: string) => api.get<PhaseRecord & { client: ClientRecord }>(`/phases/${id}`),
  update: (id: string, data: { name?: string; description?: string; deliveryDate?: string | null }) =>
    api.patch<PhaseRecord>(`/phases/${id}`, data),
  moveStage: (id: string, stageId: string) => api.patch<PhaseRecord>(`/phases/${id}/stage`, { stageId }),
  remove: (id: string) => api.delete<void>(`/phases/${id}`),
};

export interface RequirementInput {
  title: string;
  description?: string;
  priority?: number;
  moduleId?: string;
  categoryId?: string;
  productOwner?: string;
  asanaLink?: string;
  releaseNotesText?: string;
  generalRemarks?: string;
  deliveryDate?: string | null;
}

export const requirementsApi = {
  listForPhase: (phaseId: string) => api.get<RequirementRecord[]>(`/phases/${phaseId}/requirements`),
  create: (phaseId: string, data: RequirementInput) =>
    api.post<RequirementRecord>(`/phases/${phaseId}/requirements`, data),
  get: (id: string) => api.get<RequirementRecord>(`/requirements/${id}`),
  update: (id: string, data: Partial<RequirementInput>) => api.patch<RequirementRecord>(`/requirements/${id}`, data),
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
  addComment: (requirementId: string, body: string) =>
    api.post<CommentRecord>(`/requirements/${requirementId}/comments`, { body }),
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
  create: (data: { name: string; scope: WorkflowScope; isTemplate?: boolean }) =>
    api.post<WorkflowRecord>("/workflows", data),
  clone: (id: string, data: { name: string; isTemplate?: boolean }) =>
    api.post<WorkflowRecord>(`/workflows/${id}/clone`, data),
  remove: (id: string) => api.delete<void>(`/workflows/${id}`),
  addStage: (id: string, data: { stageId: string; position?: number }) =>
    api.post(`/workflows/${id}/stages`, data),
  removeStage: (id: string, workflowStageId: string) =>
    api.delete<void>(`/workflows/${id}/stages/${workflowStageId}`),
  reorderStages: (id: string, orderedWorkflowStageIds: string[]) =>
    api.put<WorkflowRecord>(`/workflows/${id}/stages/reorder`, { orderedWorkflowStageIds }),
};

export const modulesApi = {
  list: () => api.get<ModuleRecord[]>("/modules"),
  create: (data: { name: string; description?: string }) => api.post<ModuleRecord>("/modules", data),
  update: (id: string, data: { name?: string; description?: string }) =>
    api.patch<ModuleRecord>(`/modules/${id}`, data),
  remove: (id: string) => api.delete<void>(`/modules/${id}`),
};

export const categoriesApi = {
  list: () => api.get<CategoryRecord[]>("/categories"),
  create: (data: { name: string; showByDefault?: boolean }) => api.post<CategoryRecord>("/categories", data),
  update: (id: string, data: { name?: string; showByDefault?: boolean }) =>
    api.patch<CategoryRecord>(`/categories/${id}`, data),
  remove: (id: string) => api.delete<void>(`/categories/${id}`),
};

export const auditLogsApi = {
  list: (entityType: string, entityId: string) =>
    api.get<AuditLogRecord[]>(`/audit-logs?entityType=${entityType}&entityId=${entityId}`),
  rollup: (entityType: "client" | "phase", entityId: string) =>
    api.get<TimelineNode>(`/audit-logs/rollup?entityType=${entityType}&entityId=${entityId}`),
};
