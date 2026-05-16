"use client";

export interface RestRequestItem {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: Array<{ key: string; value: string }>;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface RestCollection {
  id: string;
  name: string;
  requests: RestRequestItem[];
  createdAt: string;
}

export interface RestWorkspace {
  version: 1;
  collections: RestCollection[];
  environments: Array<{ id: string; name: string; variables: Record<string, string> }>;
}

const STORAGE_KEY = "devtoolbox:rest-workspace:v1";

export function emptyWorkspace(): RestWorkspace {
  return { version: 1, collections: [], environments: [] };
}

export function isRestWorkspace(value: unknown): value is RestWorkspace {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as RestWorkspace).version === 1 &&
    Array.isArray((value as RestWorkspace).collections) &&
    Array.isArray((value as RestWorkspace).environments)
  );
}

export function loadWorkspace(): RestWorkspace {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyWorkspace();
    const parsed = JSON.parse(raw) as unknown;
    return isRestWorkspace(parsed) ? parsed : emptyWorkspace();
  } catch {
    return emptyWorkspace();
  }
}

export function saveWorkspace(workspace: RestWorkspace): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
}

export function upsertRequest(workspace: RestWorkspace, collectionName: string, request: Omit<RestRequestItem, "id" | "createdAt" | "updatedAt">): RestWorkspace {
  const now = new Date().toISOString();
  const collection =
    workspace.collections.find((item) => item.name === collectionName) ??
    { id: crypto.randomUUID(), name: collectionName, requests: [], createdAt: now };
  const item: RestRequestItem = { ...request, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
  const nextCollection = { ...collection, requests: [item, ...collection.requests].slice(0, 50) };
  const collections = [nextCollection, ...workspace.collections.filter((item) => item.id !== collection.id)];
  return { ...workspace, collections };
}
