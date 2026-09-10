export interface ClientRecord {
  id: string;
  name: string;
  slackChannelId: string | null;
  slackChannelName: string | null;
  adoOrgUrl: string | null;
  adoProject: string | null;
  adoAreaPath: string | null;
  adoDoneStates: string[];
  adoPatConfigured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TrackerRecord {
  id: string;
  clientId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  _count?: { requirements: number };
}

export type RequirementStatus = "NOT_STARTED" | "IN_PROGRESS" | "DONE";

export interface LinkedWorkItemRecord {
  id: string;
  requirementId: string;
  adoId: number;
  title: string | null;
  descriptionText: string | null;
  acceptanceCriteriaText: string | null;
  adoState: string | null;
  productOwner: string | null;
  assignedTo: string | null;
  lastSyncedAt: string | null;
}

export interface FigmaReferenceRecord {
  id: string;
  requirementId: string;
  fileKey: string;
  nodeId: string | null;
  fileName: string | null;
  url: string;
  thumbnailUrl: string | null;
  addedAt: string;
}

export type ReleaseNoteStatus = "DRAFT" | "APPROVED" | "SENT" | "FAILED";

export interface ReleaseNoteRecord {
  id: string;
  requirementId: string;
  version: number;
  status: ReleaseNoteStatus;
  category: string | null;
  screens: string[];
  problemStatement: string | null;
  objective: string | null;
  stepsToUse: string | null;
  acceptanceCriteria: string | null;
  generatedAt: string;
  approvedAt: string | null;
  sentAt: string | null;
  requirement?: RequirementRecord;
}

export interface RequirementRecord {
  id: string;
  trackerId: string;
  title: string;
  description: string | null;
  status: RequirementStatus;
  doneAt: string | null;
  createdAt: string;
  updatedAt: string;
  linkedWorkItems: LinkedWorkItemRecord[];
  releaseNotes?: ReleaseNoteRecord[];
  figmaReferences?: FigmaReferenceRecord[];
  tracker?: { client: ClientRecord };
}

export interface SyncRunResult {
  syncRunId: string;
  clientsSynced: number;
  linkedItemsUpdated: number;
  requirementsCompleted: number;
  errors: string[];
}
