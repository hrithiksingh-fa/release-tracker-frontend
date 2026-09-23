import { useEffect, useState, type ReactNode } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, Link2 } from "lucide-react";
import { stagesApi, workflowsApi, modulesApi, categoriesApi, clientsApi } from "../api/resources.js";
import type { StageRecord, WorkflowRecord, WorkflowScope, ModuleRecord, CategoryRecord, ClientRecord } from "../api/types.js";

type Tab = "stages" | "workflows" | "modules" | "categories";

export function AdminPage() {
  const [tab, setTab] = useState<Tab>("workflows");

  return (
    <div className="mx-auto max-w-5xl p-8">
      <h1 className="mb-1 text-xl font-semibold">Settings</h1>
      <p className="mb-6 text-sm text-[var(--text-dim)]">
        Manage the shared Stage master, the workflows built from it, the module list, and requirement categories.
      </p>

      <div className="mb-6 flex gap-2 border-b border-[var(--border)]">
        {(["workflows", "stages", "modules", "categories"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2 text-sm font-medium capitalize ${
              tab === t ? "border-[var(--accent)] text-[var(--text)]" : "border-transparent text-[var(--text-dim)] hover:text-[var(--text)]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "stages" && <StagesTab />}
      {tab === "workflows" && <WorkflowsTab />}
      {tab === "modules" && <ModulesTab />}
      {tab === "categories" && <CategoriesTab />}
    </div>
  );
}

// --- Stages -----------------------------------------------------------------

function StagesTab() {
  const [stages, setStages] = useState<StageRecord[]>([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState("var(--accent)");
  const [isDoneStage, setIsDoneStage] = useState(false);

  function reload() {
    stagesApi.list().then(setStages);
  }
  useEffect(reload, []);

  async function create() {
    if (!name.trim()) return;
    await stagesApi.create({ name: name.trim(), color, isDoneStage });
    setName("");
    setIsDoneStage(false);
    reload();
  }

  async function remove(id: string) {
    await stagesApi.remove(id);
    reload();
  }

  return (
    <div>
      <p className="mb-4 text-xs text-[var(--text-dim)]">
        The shared pool every workflow's stages are picked from. "Done"-flagged stages trigger release-note
        generation when a requirement moves into one.
      </p>
      <div className="mb-4 flex flex-wrap items-end gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3">
        <Field label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="e.g. QA" />
        </Field>
        <Field label="Color">
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-14 rounded-lg border border-[var(--border)] bg-[var(--panel-2)]" />
        </Field>
        <label className="mb-0.5 flex items-center gap-2 pb-2 text-sm text-[var(--text-dim)]">
          <input type="checkbox" checked={isDoneStage} onChange={(e) => setIsDoneStage(e.target.checked)} />
          Is "Done" stage
        </label>
        <button onClick={create} disabled={!name.trim()} className="flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
          <Plus size={16} /> Add stage
        </button>
      </div>

      <div className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--panel)]">
        {stages.map((s) => (
          <div key={s.id} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: s.color ?? "var(--text-dim)" }} />
              <span className="text-sm font-medium text-[var(--text)]">{s.name}</span>
              {s.isDoneStage && <span className="rounded-full bg-[var(--green)]/15 px-2 py-0.5 text-[10px] font-semibold text-[var(--green)]">DONE</span>}
            </div>
            <button onClick={() => remove(s.id)} className="text-[var(--text-dim)] hover:text-[var(--red)]">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {stages.length === 0 && <p className="px-4 py-6 text-center text-sm text-[var(--text-dim)]">No stages yet.</p>}
      </div>
    </div>
  );
}

// --- Workflows ----------------------------------------------------------------

function WorkflowsTab() {
  const [workflows, setWorkflows] = useState<WorkflowRecord[]>([]);
  const [stages, setStages] = useState<StageRecord[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  function reload() {
    workflowsApi.list().then((list) => {
      setWorkflows(list);
      if (!selectedId && list.length) setSelectedId(list[0].id);
    });
    stagesApi.list().then(setStages);
    clientsApi.list().then(setClients);
  }
  useEffect(reload, []);

  const selected = workflows.find((w) => w.id === selectedId) ?? null;

  return (
    <div className="flex gap-6">
      <div className="w-64 shrink-0">
        <button
          onClick={() => setShowCreate(true)}
          className="mb-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          <Plus size={16} /> New workflow
        </button>
        <div className="flex flex-col gap-1">
          {(["CLIENT", "PHASE", "REQUIREMENT"] as WorkflowScope[]).map((scope) => (
            <div key={scope} className="mb-2">
              <div className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-dim)]">{scope}</div>
              {workflows
                .filter((w) => w.scope === scope)
                .map((w) => (
                  <button
                    key={w.id}
                    onClick={() => setSelectedId(w.id)}
                    className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
                      w.id === selectedId ? "bg-[var(--accent)]/15 text-[var(--text)]" : "text-[var(--text-dim)] hover:bg-[var(--hover-surface)]"
                    }`}
                  >
                    {w.name}
                    {w.isTemplate && <span className="ml-1.5 text-[10px] text-[var(--amber)]">template</span>}
                  </button>
                ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1">
        {selected ? (
          <WorkflowDetail
            workflow={selected}
            stages={stages}
            clients={clients}
            onChange={reload}
            onDeleted={() => {
              setSelectedId(null);
              reload();
            }}
          />
        ) : (
          <p className="text-sm text-[var(--text-dim)]">Select a workflow, or create one.</p>
        )}
      </div>

      {showCreate && (
        <CreateWorkflowModal
          workflows={workflows}
          onClose={() => setShowCreate(false)}
          onCreated={(id) => {
            setShowCreate(false);
            setSelectedId(id);
            reload();
          }}
        />
      )}
    </div>
  );
}

function WorkflowDetail({
  workflow,
  stages,
  clients,
  onChange,
  onDeleted,
}: {
  workflow: WorkflowRecord;
  stages: StageRecord[];
  clients: ClientRecord[];
  onChange: () => void;
  onDeleted: () => void;
}) {
  const [addStageId, setAddStageId] = useState("");
  const [attachClientId, setAttachClientId] = useState("");

  const usableStages = stages.filter((s) => !workflow.stages.some((ws) => ws.stageId === s.id));

  async function addStage() {
    if (!addStageId) return;
    await workflowsApi.addStage(workflow.id, { stageId: addStageId });
    setAddStageId("");
    onChange();
  }

  async function removeStage(workflowStageId: string) {
    await workflowsApi.removeStage(workflow.id, workflowStageId);
    onChange();
  }

  async function move(index: number, dir: -1 | 1) {
    const ordered = [...workflow.stages].sort((a, b) => a.position - b.position);
    const swapWith = index + dir;
    if (swapWith < 0 || swapWith >= ordered.length) return;
    [ordered[index], ordered[swapWith]] = [ordered[swapWith], ordered[index]];
    await workflowsApi.reorderStages(workflow.id, ordered.map((s) => s.id));
    onChange();
  }

  async function attach() {
    if (!attachClientId || workflow.scope === "CLIENT") return;
    await clientsApi.attachWorkflow(attachClientId, workflow.scope as "PHASE" | "REQUIREMENT", workflow.id);
    setAttachClientId("");
    onChange();
  }

  async function remove() {
    await workflowsApi.remove(workflow.id);
    onDeleted();
  }

  const orderedStages = [...workflow.stages].sort((a, b) => a.position - b.position);
  const attachedClient = workflow.clientUsingAsPhaseWorkflow ?? workflow.clientUsingAsRequirementWorkflow;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-base font-semibold text-[var(--text)]">{workflow.name}</h2>
        <button onClick={remove} className="text-[var(--text-dim)] hover:text-[var(--red)]" title="Delete workflow">
          <Trash2 size={16} />
        </button>
      </div>
      <p className="mb-4 text-xs text-[var(--text-dim)]">
        {workflow.scope} scope{attachedClient && <> · attached to <span className="text-[var(--text)]">{attachedClient.name}</span></>}
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {orderedStages.map((ws, i) => (
          <div key={ws.id} className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--panel-2)] py-1 pl-3 pr-1.5 text-xs">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ws.stage.color ?? "var(--text-dim)" }} />
            <span className="text-[var(--text)]">{ws.stage.name}</span>
            <button onClick={() => move(i, -1)} disabled={i === 0} className="text-[var(--text-dim)] hover:text-[var(--text)] disabled:opacity-30">
              <ArrowUp size={11} />
            </button>
            <button onClick={() => move(i, 1)} disabled={i === orderedStages.length - 1} className="text-[var(--text-dim)] hover:text-[var(--text)] disabled:opacity-30">
              <ArrowDown size={11} />
            </button>
            <button onClick={() => removeStage(ws.id)} className="text-[var(--text-dim)] hover:text-[var(--red)]">
              <Trash2 size={11} />
            </button>
          </div>
        ))}
        {orderedStages.length === 0 && <p className="text-xs text-[var(--text-dim)]">No stages in this workflow yet.</p>}
      </div>

      <div className="mb-5 flex gap-2">
        <select value={addStageId} onChange={(e) => setAddStageId(e.target.value)} className={inputClass}>
          <option value="">Add a stage…</option>
          {usableStages.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button onClick={addStage} disabled={!addStageId} className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-dim)] hover:border-[var(--accent)] hover:text-[var(--text)] disabled:opacity-50">
          Add
        </button>
      </div>

      {workflow.scope !== "CLIENT" && (
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[var(--text-dim)]">
            <Link2 size={12} /> Attach to a client's {workflow.scope.toLowerCase()} workflow
          </div>
          <div className="flex gap-2">
            <select value={attachClientId} onChange={(e) => setAttachClientId(e.target.value)} className={inputClass}>
              <option value="">Pick a client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button onClick={attach} disabled={!attachClientId} className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-dim)] hover:border-[var(--accent)] hover:text-[var(--text)] disabled:opacity-50">
              Attach
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CreateWorkflowModal({
  workflows,
  onClose,
  onCreated,
}: {
  workflows: WorkflowRecord[];
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [scope, setScope] = useState<WorkflowScope>("PHASE");
  const [cloneFrom, setCloneFrom] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = cloneFrom
        ? await workflowsApi.clone(cloneFrom, { name: name.trim() })
        : await workflowsApi.create({ name: name.trim(), scope });
      onCreated(result.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create workflow");
    } finally {
      setSubmitting(false);
    }
  }

  const cloneCandidates = workflows.filter((w) => w.scope === scope);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--panel)] p-6">
        <h2 className="mb-4 text-base font-semibold text-[var(--text)]">New workflow</h2>
        <div className="flex flex-col gap-3">
          <Field label="Name">
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Scope">
            <select value={scope} onChange={(e) => setScope(e.target.value as WorkflowScope)} className={inputClass}>
              <option value="CLIENT">Client</option>
              <option value="PHASE">Phase</option>
              <option value="REQUIREMENT">Requirement</option>
            </select>
          </Field>
          {cloneCandidates.length > 0 && (
            <Field label="Clone stages from (optional)">
              <select value={cloneFrom} onChange={(e) => setCloneFrom(e.target.value)} className={inputClass}>
                <option value="">Start empty</option>
                {cloneCandidates.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </div>
        {error && <p className="mt-3 text-sm text-[var(--red)]">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-3 py-2 text-sm text-[var(--text-dim)] hover:text-[var(--text)]">
            Cancel
          </button>
          <button onClick={submit} disabled={submitting || !name.trim()} className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
            {submitting ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Modules ------------------------------------------------------------------

function ModulesTab() {
  const [modules, setModules] = useState<ModuleRecord[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  function reload() {
    modulesApi.list().then(setModules);
  }
  useEffect(reload, []);

  async function create() {
    if (!name.trim()) return;
    await modulesApi.create({ name: name.trim(), description: description.trim() || undefined });
    setName("");
    setDescription("");
    reload();
  }

  async function remove(id: string) {
    await modulesApi.remove(id);
    reload();
  }

  return (
    <div>
      <p className="mb-4 text-xs text-[var(--text-dim)]">Shown as a multi-select on the client form ("modules they use").</p>
      <div className="mb-4 flex flex-wrap items-end gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3">
        <Field label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="e.g. Bulk Upload" />
        </Field>
        <Field label="Description">
          <input value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} placeholder="Optional" />
        </Field>
        <button onClick={create} disabled={!name.trim()} className="flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
          <Plus size={16} /> Add module
        </button>
      </div>

      <div className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--panel)]">
        {modules.map((m) => (
          <div key={m.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="text-sm font-medium text-[var(--text)]">{m.name}</div>
              {m.description && <div className="text-xs text-[var(--text-dim)]">{m.description}</div>}
            </div>
            <button onClick={() => remove(m.id)} className="text-[var(--text-dim)] hover:text-[var(--red)]">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {modules.length === 0 && <p className="px-4 py-6 text-center text-sm text-[var(--text-dim)]">No modules yet.</p>}
      </div>
    </div>
  );
}

// --- Categories ----------------------------------------------------------------

function CategoriesTab() {
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [name, setName] = useState("");
  const [showByDefault, setShowByDefault] = useState(true);

  function reload() {
    categoriesApi.list().then(setCategories);
  }
  useEffect(reload, []);

  async function create() {
    if (!name.trim()) return;
    await categoriesApi.create({ name: name.trim(), showByDefault });
    setName("");
    setShowByDefault(true);
    reload();
  }

  async function toggle(c: CategoryRecord) {
    await categoriesApi.update(c.id, { showByDefault: !c.showByDefault });
    reload();
  }

  async function remove(id: string) {
    await categoriesApi.remove(id);
    reload();
  }

  return (
    <div>
      <p className="mb-4 text-xs text-[var(--text-dim)]">
        Requirement classification (default: Feasible / Not Feasible). Categories with "show by default" off are
        hidden from a phase's requirement list/board until the viewer switches on "show not feasible".
      </p>
      <div className="mb-4 flex flex-wrap items-end gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3">
        <Field label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="e.g. On Hold" />
        </Field>
        <label className="mb-0.5 flex items-center gap-2 pb-2 text-sm text-[var(--text-dim)]">
          <input type="checkbox" checked={showByDefault} onChange={(e) => setShowByDefault(e.target.checked)} />
          Show by default
        </label>
        <button onClick={create} disabled={!name.trim()} className="flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
          <Plus size={16} /> Add category
        </button>
      </div>

      <div className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--panel)]">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center justify-between px-4 py-3">
            <div className="text-sm font-medium text-[var(--text)]">{c.name}</div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggle(c)}
                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                  c.showByDefault
                    ? "border-[var(--green)]/35 bg-[var(--green)]/15 text-[var(--green)]"
                    : "border-[var(--border)] text-[var(--text-dim)]"
                }`}
              >
                {c.showByDefault ? "Shown by default" : "Hidden by default"}
              </button>
              <button onClick={() => remove(c.id)} className="text-[var(--text-dim)] hover:text-[var(--red)]">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {categories.length === 0 && <p className="px-4 py-6 text-center text-sm text-[var(--text-dim)]">No categories yet.</p>}
      </div>
    </div>
  );
}

const inputClass =
  "rounded-lg border border-[var(--border)] bg-[var(--panel-2)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-[var(--text-dim)]">{label}</span>
      {children}
    </label>
  );
}
