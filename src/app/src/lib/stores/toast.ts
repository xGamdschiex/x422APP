/**
 * Toast-Store — Seeds-Notifications mit Auto-Dismiss.
 */
import { writable } from 'svelte/store';

export interface Toast {
  id: number;
  message: string;
  seeds: number;
}

let nextId = 0;

function createToastStore() {
  const { subscribe, update } = writable<Toast[]>([]);

  return {
    subscribe,
    show(seeds: number, message: string = '') {
      const id = nextId++;
      const label = message || `+${seeds} Seeds`;
      update(t => [...t, { id, message: label, seeds }]);
      setTimeout(() => {
        update(t => t.filter(x => x.id !== id));
      }, 2500);
    },
  };
}

export const toastStore = createToastStore();
