import { api } from "./client.js";
import type {
  ClientRecord,
  TrackerRecord,
  RequirementRecord,
  LinkedWorkItemRecord,
  ReleaseNoteRecord,
  ReleaseNoteStatus,
  SyncRunResult,
} from "./types.js";

export const clientsApi = {
  list: () => api.get<ClientRecord[]>("/clients"),
  get: (id: string) => api.get<ClientRecord & { trackers: TrackerRecord[] }>(`/clients/${id}`),
  create: (data: Partial<ClientRecord> & { name: string; adoPat?: string }) =>
    api.post<ClientRecord>("/clients", data),
  update: (id: string, data: Partial<ClientRecord> & { adoPat?: string }) =>
    api.patch<ClientRecord>(`/clients/${id}`, data),
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
  create: (trackerId: string, data: { title: string; description?: string }) =>
    api.post<RequirementRecord>(`/trackers/${trackerId}/requirements`, data),
  get: (id: string) => api.get<RequirementRecord>(`/requirements/${id}`),
  update: (id: string, data: { title?: string; description?: string }) =>
    api.patch<RequirementRecord>(`/requirements/${id}`, data),
  remove: (id: string) => api.delete<void>(`/requirements/${id}`),
  linkExisting: (requirementId: string, adoId: number) =>
    api.post<LinkedWorkItemRecord>(`/requirements/${requirementId}/linked-work-items`, { adoId }),
  createInAdo: (requirementId: string, data: { title: string; description?: string; workItemType?: string }) =>
    api.post<LinkedWorkItemRecord>(`/requirements/${requirementId}/linked-work-items`, data),
  unlink: (requirementId: string, linkedId: string) =>
    api.delete<void>(`/requirements/${requirementId}/linked-work-items/${linkedId}`),
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
