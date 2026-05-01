import {
  BackupSchema,
  Card,
  CardEvent,
  MAX_GENERATED,
  Settings,
  SettingsSchema,
  EventSchema,
  CardSchema,
  type Backup,
} from "./types";

const K_EVENTS = "mindful:events";
const K_GENERATED = "mindful:generated";
const K_SETTINGS = "mindful:settings";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function ls(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readEvents(): CardEvent[] {
  const s = ls();
  if (!s) return [];
  const arr = safeParse<unknown[]>(s.getItem(K_EVENTS), []);
  const out: CardEvent[] = [];
  for (const raw of arr) {
    const parsed = EventSchema.safeParse(raw);
    if (parsed.success) out.push(parsed.data);
  }
  return out;
}

export function appendEvent(ev: CardEvent): void {
  const s = ls();
  if (!s) return;
  const current = readEvents();
  current.push(ev);
  try {
    s.setItem(K_EVENTS, JSON.stringify(current));
  } catch {
    // quota exceeded; drop oldest half
    const trimmed = current.slice(Math.floor(current.length / 2));
    try {
      s.setItem(K_EVENTS, JSON.stringify(trimmed));
    } catch {
      /* ignore */
    }
  }
}

export function clearEvents(): void {
  ls()?.removeItem(K_EVENTS);
}

export function readGenerated(): Card[] {
  const s = ls();
  if (!s) return [];
  const arr = safeParse<unknown[]>(s.getItem(K_GENERATED), []);
  const out: Card[] = [];
  for (const raw of arr) {
    const parsed = CardSchema.safeParse(raw);
    if (parsed.success) out.push(parsed.data);
  }
  return out;
}

export function writeGenerated(cards: Card[]): void {
  const s = ls();
  if (!s) return;
  try {
    s.setItem(K_GENERATED, JSON.stringify(cards));
  } catch {
    const trimmed = cards.slice(-Math.floor(cards.length / 2));
    try {
      s.setItem(K_GENERATED, JSON.stringify(trimmed));
    } catch {
      /* ignore */
    }
  }
}

/**
 * Append new generated cards. Dedupe by id against existing. Enforce ring-buffer cap:
 * when over MAX_GENERATED, evict oldest entries that are neither seen nor hearted.
 */
export function appendGenerated(
  newCards: Card[],
  opts: { seenIds: Set<string>; heartedIds: Set<string> },
): Card[] {
  const existing = readGenerated();
  const byId = new Map(existing.map((c) => [c.id, c]));
  for (const c of newCards) if (!byId.has(c.id)) byId.set(c.id, c);
  let merged = [...byId.values()];
  if (merged.length > MAX_GENERATED) {
    const evictable = merged.filter(
      (c) => !opts.seenIds.has(c.id) && !opts.heartedIds.has(c.id),
    );
    const keepers = merged.filter(
      (c) => opts.seenIds.has(c.id) || opts.heartedIds.has(c.id),
    );
    const overflow = merged.length - MAX_GENERATED;
    const droppedIds = new Set(evictable.slice(0, overflow).map((c) => c.id));
    merged = [...keepers, ...evictable.slice(overflow)];
    if (merged.length > MAX_GENERATED) {
      merged = merged.slice(merged.length - MAX_GENERATED);
    }
    void droppedIds;
  }
  writeGenerated(merged);
  return merged;
}

export function clearGenerated(): void {
  ls()?.removeItem(K_GENERATED);
}

export function readSettings(): Settings {
  const s = ls();
  const fallback = SettingsSchema.parse({});
  if (!s) return fallback;
  const raw = safeParse<unknown>(s.getItem(K_SETTINGS), {});
  const parsed = SettingsSchema.safeParse(raw);
  return parsed.success ? parsed.data : fallback;
}

export function writeSettings(patch: Partial<Settings>): Settings {
  const s = ls();
  const current = readSettings();
  const next = SettingsSchema.parse({ ...current, ...patch });
  if (s) {
    try {
      s.setItem(K_SETTINGS, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }
  return next;
}

export function clearSettings(): void {
  ls()?.removeItem(K_SETTINGS);
}

export function exportBackup(): Backup {
  return BackupSchema.parse({
    version: 1,
    events: readEvents(),
    generated: readGenerated(),
    settings: readSettings(),
  });
}

export function importBackup(data: unknown): void {
  const parsed = BackupSchema.parse(data);
  const s = ls();
  if (!s) return;
  s.setItem(K_EVENTS, JSON.stringify(parsed.events));
  s.setItem(K_GENERATED, JSON.stringify(parsed.generated));
  s.setItem(K_SETTINGS, JSON.stringify(parsed.settings));
}
