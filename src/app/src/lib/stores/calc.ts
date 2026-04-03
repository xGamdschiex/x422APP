/**
 * Calc store — derived from userStore, runs calculation reactively
 */
import { derived } from 'svelte/store';
import { userStore } from './user';
import { calculate, type CalcResult } from '../calc/nutrients';
import { getFeedLine } from '../calc/feedlines/registry';
import type { CalMagTyp } from '../calc/schema';

export interface CalcState {
  result: CalcResult | null;
  error: string | null;
}

export const calcStore = derived<typeof userStore, CalcState>(
  userStore,
  ($user) => {
    try {
      // Phase-Validierung: Prüfen ob Phase in der FeedLine existiert
      const feedline = getFeedLine($user.feedline);
      let phase = $user.phase;
      let woche = $user.woche;
      if (feedline) {
        const validPhases = feedline.phasen.map(p => p.name);
        if (!validPhases.includes(phase)) {
          phase = feedline.phasen[0]?.name ?? 'Veg';
          woche = 1;
        }
      }

      const result = calculate({
        feedline_id: $user.feedline,
        wasserprofil: $user.standort,
        phase,
        woche,
        tag: $user.tag,
        strain: $user.strain,
        reservoir_L: $user.reservoir_L,
        faktor_modus: $user.faktor_modus,
        faktor_manuell: $user.faktor_manuell,
        calmag_typ: $user.calmag_typ as CalMagTyp,
        ec_einheit: $user.ec_einheit,
        medium: $user.medium,
        hat_ro: $user.hat_ro,
      });
      return { result, error: null };
    } catch (e) {
      return { result: null, error: e instanceof Error ? e.message : String(e) };
    }
  }
);
