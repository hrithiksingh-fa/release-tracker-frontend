export interface StageRecord {
  id: string;
  name: string;
  color: string | null;
  isDoneStage: boolean;
}

export type WorkflowScope = "CLIENT" | "PHASE" | "REQUIREMENT";

export interface WorkflowStageRecord {
  id: string; // WorkflowStage id -- this is what Client.currentStageId / Phase.stageId / Requirement.stageId point at
  workflowId: string;
  stageId: string; // Stage id (the master record)
  position: number;
  stage: StageRecord;
}

export interface WorkflowRecord {
  id: string;
  name: string;
  scope: WorkflowScope;
  isTemplate: boolean;
  stages: WorkflowStageRecord[];
  clientUsingAsPhaseWorkflow?: ClientRecord | null;
  clientUsingAsRequirementWorkflow?: ClientRecord | null;
}

export interface ModuleRecord {
  id: string;
  name: string;
  description: string | null;
}

export interface CategoryRecord {
  id: string;
  name: string;
  showByDefault: boolean;
}

export interface ClientRecord {
  id: string;
  name: string;
  description: string | null;
  productOwner: string | null;
  deliveryDate: string | null;
  slackChannelId: string | null;
  slackChannelName: string | null;
  adoProjectUrl: string | null;
  adoDoneStates: string[];
  adoPatConfigured: boolean;
  currentStageId: string | null;
  currentStage?: WorkflowStageRecord | null;
  phaseWorkflowId: string | null;
  phaseWorkflow?: WorkflowRecord | null;
  requirementWorkflowId: string | null;
  requirementWorkflow?: WorkflowRecord | null;
  modules?: ModuleRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface PhaseRecord {
  id: string;
  clientId: string;
  name: string;
  description: string | null;
  deliveryDate: string | null;
  stageId: string | null;
  stage?: WorkflowStageRecord | null;
  createdAt: string;
  updatedAt: string;
  _count?: { requirements: number };
  client?: ClientRecord;
}

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

export interface CommentRecord {
  id: string;
  requirementId: string;
  body: string;
  author: string;
  createdAt: string;
}

export type ReleaseNoteStatus = "DRAFT" | "APPROVED" | "SENT" | "FAILED";

export interface ReleaseNoteRecord {
  id: string;
  requirementId: string;
  version: number;
  status: ReleaseNoteStatus;
  category: string | null; // auto-classified New Features / Enhancements / Bug Fixes -- unrelated to the Category master
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

// P0 (highest) .. P10 (lowest) -- the number itself is the sort key.
export type RequirementPriority = number;

export interface RequirementRecord {
  id: string;
  phaseId: string;
  title: string;
  description: string | null;
  priority: RequirementPriority;
  moduleId: string | null;
  module?: ModuleRecord | null;
  categoryId: string | null;
  category?: CategoryRecord | null;
  productOwner: string | null;
  asanaLink: string | null;
  releaseNotesText: string | null;
  generalRemarks: string | null;
  deliveryDate: string | null;
  stageId: string | null;
  stage?: WorkflowStageRecord | null;
  doneAt: string | null;
  createdAt: string;
  updatedAt: string;
  linkedWorkItems: LinkedWorkItemRecord[];
  releaseNotes?: ReleaseNoteRecord[];
  figmaReferences?: FigmaReferenceRecord[];
  comments?: CommentRecord[];
  phase?: { client: ClientRecord };
}

export type ActivityType = "create" | "update" | "stage_change" | "comment" | "pbi" | "figma";

export interface AuditLogRecord {
  id: string;
  entityType: string;
  entityId: string;
  activityType: ActivityType;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  actor: string;
  occurredAt: string;
}

export interface TimelineNode {
  entityType: string;
  entityId: string;
  label: string;
  logs: AuditLogRecord[];
  children?: TimelineNode[];
}

export interface SyncRunResult {
  syncRunId: string;
  clientsSynced: number;
  linkedItemsUpdated: number;
  errors: string[];
}
