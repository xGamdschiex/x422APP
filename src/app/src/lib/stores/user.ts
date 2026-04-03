/**
 * User preferences store — persisted in localStorage
 */
import { writable } from 'svelte/store';
import type { CalMagTyp } from '../calc/schema';
import type { ECEinheit } from '../calc/units';
import type { FaktorModus } from '../calc/factor';
import type { Medium } from '../calc/feedlines/types';

export interface UserPrefs {
  /** NEU: Gewählte Düngerlinie */
  feedline: string;
  standort: string;
  strain: string;
  /** Generisch: Phase-Name (nicht mehr hardcoded Phase type) */
  phase: string;
  woche: number;
  tag: number;
  reservoir_L: number;
  faktor_modus: FaktorModus;
  faktor_manuell: number;
  calmag_typ: CalMagTyp;
  ec_einheit: ECEinheit;
  run_id: string;
  /** NEU: Anbaumedium (für Lines die medium-abhängig dosieren) */
  medium: Medium;
  /** Hat der User RO-Wasser? Nein = nur Leitungswasser */
  hat_ro: boolean;
}

const STORAGE_KEY = 'athena_user_prefs';

const DEFAULTS: UserPrefs = {
  feedline: 'athena-pro',
  standort: 'Mainz Petersaue',
  strain: '',
  phase: 'Veg',
  woche: 1,
  tag: 1,
  reservoir_L: 47,
  faktor_modus: 'Auto',
  faktor_manuell: 70,
  calmag_typ: 'A',
  ec_einheit: 'mS/cm',
  run_id: '',
  medium: 'coco',
  hat_ro: true,
};

function loadPrefs(): UserPrefs {
  if (typeof localStorage === 'undefined') return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

function createUserStore() {
  const { subscribe, set, update } = writable<UserPrefs>(loadPrefs());

  return {
    subscribe,
    set(prefs: UserPrefs) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
      set(prefs);
    },
    update(fn: (prefs: UserPrefs) => UserPrefs) {
      update(current => {
        const next = fn(current);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    reset() {
      localStorage.removeItem(STORAGE_KEY);
      set({ ...DEFAULTS });
    }
  };
}

export const userStore = createUserStore();
