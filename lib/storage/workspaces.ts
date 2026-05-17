export interface RestRequestItem {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: Array<{ key: string; value: string }>;
  body: string;
  createdAt: string;
  updatedAt: string;
  lastRun?: RestRequestRun;
}

export interface RestRequestRun {
  status?: number;
  ok: boolean;
  latencyMs?: number;
  ranAt: string;
  error?: string;
}

export interface RestCollection {
  id: string;
  name: string;
  requests: RestRequestItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface WorkspaceQrCode {
  id: string;
  text: string;
  dataUrl: string;
  createdAt: string;
}

export interface WorkspaceRecentItem {
  id: string;
  type: "tool" | "rest-request" | "qr-code";
  title: string;
  href: string;
  subtitle?: string;
  dedupeKey?: string;
  createdAt: string;
}

export interface RestWorkspace {
  version: 2;
  collections: RestCollection[];
  environments: Array<{ id: string; name: string; variables: Record<string, string> }>;
  recentItems: WorkspaceRecentItem[];
  qrCodes: WorkspaceQrCode[];
}

const STORAGE_KEY = "devtoolbox:rest-workspace:v1";
const MAX_RECENT_ITEMS = 12;
const MAX_QR_CODES = 24;

interface LegacyWorkspace {
  version: 1;
  collections: RestCollection[];
  environments: RestWorkspace["environments"];
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isLegacyWorkspace(value: unknown): value is LegacyWorkspace {
  if (!isObjectRecord(value)) return false;

  return value.version === 1 && Array.isArray(value.collections) && Array.isArray(value.environments);
}

export function emptyWorkspace(): RestWorkspace {
  return { version: 2, collections: [], environments: [], recentItems: [], qrCodes: [] };
}

export function isRestWorkspace(value: unknown): value is RestWorkspace {
  if (!isObjectRecord(value)) return false;

  return (
    value.version === 2 &&
    Array.isArray(value.collections) &&
    Array.isArray(value.environments) &&
    Array.isArray(value.recentItems) &&
    Array.isArray(value.qrCodes)
  );
}

export function normalizeWorkspace(value: unknown): RestWorkspace {
  if (isRestWorkspace(value)) return value;

  if (isLegacyWorkspace(value)) {
    return {
      version: 2,
      collections: value.collections,
      environments: value.environments,
      recentItems: [],
      qrCodes: [],
    };
  }

  return emptyWorkspace();
}

export function loadWorkspace(): RestWorkspace {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyWorkspace();
    return normalizeWorkspace(JSON.parse(raw) as unknown);
  } catch {
    return emptyWorkspace();
  }
}

export function saveWorkspace(workspace: RestWorkspace): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
}

interface WorkspaceMutationOptions {
  id?: () => string;
  now?: () => string;
}

function getId(opts?: WorkspaceMutationOptions): string {
  return opts?.id?.() ?? crypto.randomUUID();
}

function getNow(opts?: WorkspaceMutationOptions): string {
  return opts?.now?.() ?? new Date().toISOString();
}

export function upsertRequest(
  workspace: RestWorkspace,
  collectionName: string,
  request: Omit<RestRequestItem, "id" | "createdAt" | "updatedAt"> & { id?: string },
  opts?: WorkspaceMutationOptions,
): RestWorkspace {
  const now = getNow(opts);
  const targetCollection =
    workspace.collections.find((item) => item.name === collectionName) ??
    { id: getId(opts), name: collectionName, requests: [], createdAt: now };
  const existing = request.id
    ? workspace.collections.flatMap((item) => item.requests).find((item) => item.id === request.id)
    : undefined;
  const item: RestRequestItem = {
    ...request,
    id: request.id ?? getId(opts),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  const cleanedCollections = workspace.collections.map((collection) => ({
    ...collection,
    requests: request.id ? collection.requests.filter((current) => current.id !== request.id) : collection.requests,
  }));
  const existingTarget = cleanedCollections.find((collection) => collection.id === targetCollection.id);
  const targetRequests = existingTarget?.requests ?? targetCollection.requests;
  const nextCollection = {
    ...(existingTarget ?? targetCollection),
    requests: [item, ...targetRequests].slice(0, 50),
    updatedAt: now,
  };
  const collections = [nextCollection, ...cleanedCollections.filter((collection) => collection.id !== nextCollection.id)];
  return { ...workspace, collections };
}

export function recordRequestRun(
  workspace: RestWorkspace,
  requestId: string,
  run: Omit<RestRequestRun, "ranAt">,
  opts?: WorkspaceMutationOptions,
): RestWorkspace {
  const ranAt = getNow(opts);
  return {
    ...workspace,
    collections: workspace.collections.map((collection) => ({
      ...collection,
      requests: collection.requests.map((request) =>
        request.id === requestId ? { ...request, lastRun: { ...run, ranAt }, updatedAt: ranAt } : request,
      ),
    })),
  };
}

export function saveQrCode(
  workspace: RestWorkspace,
  qrCode: Omit<WorkspaceQrCode, "id" | "createdAt">,
  opts?: WorkspaceMutationOptions,
): RestWorkspace {
  const item: WorkspaceQrCode = {
    ...qrCode,
    id: getId(opts),
    createdAt: getNow(opts),
  };
  return { ...workspace, qrCodes: [item, ...workspace.qrCodes].slice(0, MAX_QR_CODES) };
}

export function addRecentItem(
  workspace: RestWorkspace,
  item: Omit<WorkspaceRecentItem, "id" | "createdAt">,
  opts?: WorkspaceMutationOptions,
): RestWorkspace {
  const next: WorkspaceRecentItem = {
    ...item,
    id: getId(opts),
    createdAt: getNow(opts),
  };
  const dedupeKey = item.dedupeKey ?? `${item.href}:${item.subtitle ?? ""}`;
  return {
    ...workspace,
    recentItems: [
      next,
      ...workspace.recentItems.filter((recent) => (recent.dedupeKey ?? `${recent.href}:${recent.subtitle ?? ""}`) !== dedupeKey),
    ].slice(0, MAX_RECENT_ITEMS),
  };
}
