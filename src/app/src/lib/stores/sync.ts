/**
 * Sync store — online/offline detection + log queue
 */
import { writable, derived, get } from 'svelte/store';
import type { LogEntry } from '../api/sheets';
import { postLogEntry } from '../api/sheets';

const IDB_QUEUE_KEY = 'athena_log_queue';

function loadQueue(): LogEntry[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(IDB_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: LogEntry[]) {
  localStorage.setItem(IDB_QUEUE_KEY, JSON.stringify(queue));
}

// Individual stores (subscribable)
export const onlineStore = writable(typeof navigator !== 'undefined' ? navigator.onLine : true);
export const queueStore = writable<LogEntry[]>(loadQueue());
export const syncingStore = writable(false);
export const queueCountStore = derived(queueStore, $q => $q.length);

// Listen for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => onlineStore.set(true));
  window.addEventListener('offline', () => onlineStore.set(false));
}

/** Add a log entry to the queue */
export function enqueueLog(entry: LogEntry) {
  queueStore.update(q => {
    const next = [...q, entry];
    saveQueue(next);
    return next;
  });
}

/** Try to sync all queued entries */
export async function flushQueue() {
  const currentQueue = get(queueStore);
  if (currentQueue.length === 0) return;

  syncingStore.set(true);
  const failed: LogEntry[] = [];

  for (const entry of currentQueue) {
    const res = await postLogEntry(entry);
    if (!res.ok) {
      failed.push(entry);
    }
  }

  queueStore.set(failed);
  saveQueue(failed);
  syncingStore.set(false);
}

/** Clear the queue */
export function clearQueue() {
  queueStore.set([]);
  saveQueue([]);
}
