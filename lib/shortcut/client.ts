const SHORTCUT_API_BASE = 'https://api.app.shortcut.com/api/v3';

export interface ShortcutConfig {
  token: string;
  workflowId?: number;
  groupId?: string;
  appUrl?: string;
}

export interface CreateStoryInput {
  name: string;
  description?: string;
  storyType?: 'feature' | 'bug' | 'chore';
  workflowStateId?: number;
  workflowId?: number;
  groupId?: string;
  ownerIds?: string[];
  labels?: Array<{ name: string; color?: string }>;
  externalLinks?: string[];
  parentStoryId?: number;
  epicId?: number;
  fileIds?: number[];
}

export interface ShortcutStory {
  id: number;
  name: string;
  app_url: string;
  workflow_id: number;
  workflow_state_id: number;
  group_id?: string | null;
  owner_ids?: string[];
}

export interface ShortcutMember {
  id: string;
  profile: {
    email_address?: string | null;
    mention_name?: string;
    name?: string;
  };
  disabled?: boolean;
}

export class ShortcutError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown
  ) {
    super(message);
    this.name = 'ShortcutError';
  }
}

export function getShortcutConfig(): ShortcutConfig | null {
  const token = process.env.SHORTCUT_API_TOKEN;
  if (!token) return null;
  const workflowIdRaw = process.env.SHORTCUT_WORKFLOW_ID;
  const workflowId = workflowIdRaw ? Number(workflowIdRaw) : undefined;
  return {
    token,
    workflowId: Number.isFinite(workflowId) ? (workflowId as number) : undefined,
    groupId: process.env.SHORTCUT_GROUP_ID || undefined,
    appUrl: process.env.SHORTCUT_APP_URL || undefined,
  };
}

async function shortcutFetch<T>(
  config: ShortcutConfig,
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${SHORTCUT_API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'Shortcut-Token': config.token,
      ...(init.headers || {}),
    },
  });

  const text = await res.text();
  const body: unknown = text ? safeJson(text) : null;

  if (!res.ok) {
    throw new ShortcutError(
      `Shortcut API error: ${res.status} ${res.statusText}`,
      res.status,
      body
    );
  }
  return body as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function createStory(
  config: ShortcutConfig,
  input: CreateStoryInput
): Promise<ShortcutStory> {
  const payload: Record<string, unknown> = {
    name: input.name,
    description: input.description,
    story_type: input.storyType ?? 'bug',
  };
  if (input.workflowStateId !== undefined) {
    payload.workflow_state_id = input.workflowStateId;
  } else if (input.workflowId !== undefined) {
    payload.workflow_id = input.workflowId;
  } else if (config.workflowId !== undefined) {
    payload.workflow_id = config.workflowId;
  }
  if (input.groupId || config.groupId) {
    payload.group_id = input.groupId ?? config.groupId;
  }
  if (input.ownerIds && input.ownerIds.length > 0) {
    payload.owner_ids = input.ownerIds;
  }
  if (input.labels && input.labels.length > 0) {
    payload.labels = input.labels;
  }
  if (input.externalLinks && input.externalLinks.length > 0) {
    payload.external_links = input.externalLinks;
  }
  if (input.parentStoryId !== undefined) {
    payload.parent_story_id = input.parentStoryId;
  }
  if (input.epicId !== undefined) {
    payload.epic_id = input.epicId;
  }
  if (input.fileIds && input.fileIds.length > 0) {
    payload.file_ids = input.fileIds;
  }

  return shortcutFetch<ShortcutStory>(config, '/stories', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function findMemberIdByEmail(
  config: ShortcutConfig,
  email: string | null | undefined
): Promise<string | null> {
  if (!email) return null;
  const members = await shortcutFetch<ShortcutMember[]>(config, '/members');
  const hit = members.find(
    (m) =>
      !m.disabled &&
      m.profile?.email_address &&
      m.profile.email_address.toLowerCase() === email.toLowerCase()
  );
  return hit?.id ?? null;
}

export interface ShortcutEpic {
  id: number;
  name: string;
  state?: string;
  app_url: string;
  archived?: boolean;
  completed?: boolean;
  started?: boolean;
  group_id?: string | null;
}

export async function listEpics(config: ShortcutConfig): Promise<ShortcutEpic[]> {
  return shortcutFetch<ShortcutEpic[]>(config, '/epics');
}

export async function getEpic(config: ShortcutConfig, epicId: number): Promise<ShortcutEpic> {
  return shortcutFetch<ShortcutEpic>(config, `/epics/${epicId}`);
}

export interface ShortcutStorySummary {
  id: number;
  name: string;
  story_type: 'feature' | 'bug' | 'chore';
  app_url: string;
  workflow_state_id: number;
  epic_id?: number | null;
  parent_story_id?: number | null;
  archived?: boolean;
  completed?: boolean;
}

export async function listStoriesForEpic(
  config: ShortcutConfig,
  epicId: number
): Promise<ShortcutStorySummary[]> {
  return shortcutFetch<ShortcutStorySummary[]>(config, `/epics/${epicId}/stories`);
}

export interface ShortcutLabel {
  id: number;
  name: string;
  color?: string | null;
  archived?: boolean;
}

export async function listLabels(config: ShortcutConfig): Promise<ShortcutLabel[]> {
  return shortcutFetch<ShortcutLabel[]>(config, '/labels');
}

export async function ensureLabel(
  config: ShortcutConfig,
  name: string,
  color = '#E44'
): Promise<ShortcutLabel> {
  const labels = await listLabels(config);
  const existing = labels.find(
    (l) => !l.archived && l.name.toLowerCase() === name.toLowerCase()
  );
  if (existing) return existing;
  return shortcutFetch<ShortcutLabel>(config, '/labels', {
    method: 'POST',
    body: JSON.stringify({ name, color }),
  });
}

export interface ShortcutFileUploaded {
  id: number;
  name: string;
  url?: string;
}

export async function uploadFile(
  config: ShortcutConfig,
  file: { buffer: Buffer; filename: string; contentType: string }
): Promise<ShortcutFileUploaded> {
  const form = new FormData();
  const blob = new Blob([new Uint8Array(file.buffer)], { type: file.contentType });
  form.append('file', blob, file.filename);
  const res = await fetch(`${SHORTCUT_API_BASE}/files`, {
    method: 'POST',
    headers: { 'Shortcut-Token': config.token },
    body: form,
  });
  const text = await res.text();
  const body: unknown = text ? safeJson(text) : null;
  if (!res.ok) {
    throw new ShortcutError(
      `Shortcut file upload failed: ${res.status} ${res.statusText}`,
      res.status,
      body
    );
  }
  const arr = Array.isArray(body) ? (body as ShortcutFileUploaded[]) : [body as ShortcutFileUploaded];
  return arr[0];
}

export interface ShortcutStoryFull {
  id: number;
  name: string;
  app_url: string;
  description?: string;
  labels?: ShortcutLabel[];
  file_ids?: number[];
  story_type: 'feature' | 'bug' | 'chore';
  epic_id?: number | null;
  group_id?: string | null;
  workflow_id?: number;
  workflow_state_id?: number;
  parent_story_id?: number | null;
  owner_ids?: string[];
}

export async function getStory(
  config: ShortcutConfig,
  storyId: number
): Promise<ShortcutStoryFull> {
  return shortcutFetch<ShortcutStoryFull>(config, `/stories/${storyId}`);
}

export async function updateStory(
  config: ShortcutConfig,
  storyId: number,
  payload: {
    story_type?: 'feature' | 'bug' | 'chore';
    // Shortcut's PUT /stories/{id} only supports `labels` (full replacement).
    // Callers should merge existing labels with the new ones before passing.
    labels?: Array<{ name: string; color?: string }>;
    file_ids?: number[];
    description?: string;
  }
): Promise<ShortcutStoryFull> {
  return shortcutFetch<ShortcutStoryFull>(config, `/stories/${storyId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export interface ShortcutWorkflowState {
  id: number;
  name: string;
  type: 'unstarted' | 'started' | 'done' | 'backlog';
  position: number;
}

export interface ShortcutWorkflow {
  id: number;
  name: string;
  default_state_id?: number;
  states: ShortcutWorkflowState[];
}

export async function getWorkflow(
  config: ShortcutConfig,
  workflowId: number
): Promise<ShortcutWorkflow> {
  return shortcutFetch<ShortcutWorkflow>(config, `/workflows/${workflowId}`);
}

export async function addStoryComment(
  config: ShortcutConfig,
  storyId: number,
  text: string
): Promise<{ id: number; app_url?: string }> {
  return shortcutFetch<{ id: number; app_url?: string }>(
    config,
    `/stories/${storyId}/comments`,
    {
      method: 'POST',
      body: JSON.stringify({ text }),
    }
  );
}
