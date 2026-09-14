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

export interface ClientRecord {
  id: string;
  name: string;
  description: string | null;
  productOwner: string | null;
  deliveryDate: string | null;
  slackChannelId: string | null;
  slackChannelName: string | null;
  adoOrgUrl: string | null;
  adoProject: string | null;
  adoAreaPath: string | null;
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

export type RequirementPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface RequirementRecord {
  id: string;
  phaseId: string;
  title: string;
  description: string | null;
  priority: RequirementPriority;
  dueDate: string | null;
  revisedDueDate: string | null;
  stageId: string | null;
  stage?: WorkflowStageRecord | null;
  doneAt: string | null;
  createdAt: string;
  updatedAt: string;
  linkedWorkItems: LinkedWorkItemRecord[];
  releaseNotes?: ReleaseNoteRecord[];
  figmaReferences?: FigmaReferenceRecord[];
  phase?: { client: ClientRecord };
}

export interface AuditLogRecord {
  id: string;
  entityType: string;
  entityId: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  actor: string;
  occurredAt: string;
}

export interface SyncRunResult {
  syncRunId: string;
  clientsSynced: number;
  linkedItemsUpdated: number;
  errors: string[];
}
