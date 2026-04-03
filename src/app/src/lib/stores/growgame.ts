/**
 * GrowGame Store — Kern-Spiellogik
 * Pflanzenwachstum, Equipment, Extraction, Offline-Progression.
 * Waehrungen: Buds (Basis), Wax (Premium 1g=100 Buds), Seeds (Pflanz-Items).
 */
import { writable, derived } from 'svelte/store';
import { toastStore } from './toast';
import {
  type SpaceType, type ZwergRole, type EquipCategory,
  SPACE_DEFS, getSpaceDef, getEquip, getExtraction, EQUIP_DEFS, EXTRACTION_DEFS,
} from '../data/equipment';
import {
  type GrowPhase, type StrainType,
  getStrain, getPhasesForType, STRAIN_DEFS, SEED_PACK_DEFS,
  rollStrainFromPack,
} from '../data/strains';

// ─── TYPES ──────────────────────────────────────────────────────────────

export interface SeedItem {
  strain_id: string;
  count: number;
}

export interface OwnedEquip {
  equip_id: string;
  broken: boolean;
}

export interface GrowSpace {
  id: string;
  type: SpaceType;
  installed_equip: string[];   // equip_ids
  assigned_dwarves: number[];  // zwerg_ids
}

export interface ActiveGrow {
  id: string;
  space_id: string;
  strain_id: string;
  plant_count: number;
  started_at: number;        // Unix ms
  phase: GrowPhase;
  phase_started_at: number;  // Unix ms
  /** Ob Live-Extraction gewuenscht (ueberspringt Curing) */
  live_extraction: boolean;
}

export interface GameState {
  buds: number;
  wax: number;               // in Gramm (1g = 100 Buds Wert)
  log_tokens: number;        // Durch Calc-Logs verdient
  seed_inventory: SeedItem[];
  spaces: GrowSpace[];
  equipment: OwnedEquip[];
  owned_extractions: string[];  // extraction IDs
  grows: ActiveGrow[];
  /** Letzter Offline-Tick */
  last_tick: number;          // Unix ms
  /** Abgeschlossene Grows gesamt */
  total_harvests: number;
  total_buds_earned: number;
  total_wax_produced: number;
  /** Achievement: Licht kaputt gegangen */
  ach_light_broke: boolean;
  /** Letzter Daily-Seed-Check (YYYY-MM-DD) */
  last_daily_check: string;
}

// ─── DEFAULTS ───────────────────────────────────────────────────────────

const DEFAULTS: GameState = {
  buds: 0,
  wax: 0,
  log_tokens: 0,
  seed_inventory: [],
  spaces: [{
    id: 'space-0',
    type: 'fensterbank',
    installed_equip: [],
    assigned_dwarves: [],
  }],
  equipment: [],
  owned_extractions: [],
  grows: [],
  last_tick: Date.now(),
  total_harvests: 0,
  total_buds_earned: 0,
  total_wax_produced: 0,
  ach_light_broke: false,
  last_daily_check: '',
};

// ─── HELPERS ────────────────────────────────────────────────────────────

const STORAGE_KEY = 'athena_growgame';

function loadState(): GameState {
  if (typeof localStorage === 'undefined') return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

function persist(state: GameState): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Berechne aktuellen Ertrag-Multiplikator eines Spaces */
function spaceYieldMult(space: GrowSpace, equipment: OwnedEquip[]): number {
  let mult = 1.0;
  for (const eid of space.installed_equip) {
    const owned = equipment.find(e => e.equip_id === eid);
    if (!owned || owned.broken) continue;
    const def = getEquip(eid);
    if (def) mult *= def.yield_mult;
  }
  return mult;
}

/** Berechne Speed-Multiplikator */
function spaceSpeedMult(space: GrowSpace, equipment: OwnedEquip[]): number {
  let mult = 1.0;
  for (const eid of space.installed_equip) {
    const owned = equipment.find(e => e.equip_id === eid);
    if (!owned || owned.broken) continue;
    const def = getEquip(eid);
    if (def) mult *= def.speed_mult;
  }
  return mult;
}

/** Phasen-Progression berechnen (Offline-faehig) */
function tickGrow(grow: ActiveGrow, space: GrowSpace, equipment: OwnedEquip[], now: number): { grow: ActiveGrow; harvested: boolean; buds_earned: number } {
  const strain = getStrain(grow.strain_id);
  if (!strain) return { grow, harvested: false, buds_earned: 0 };

  const phases = getPhasesForType(strain.type);
  const speedMult = spaceSpeedMult(space, equipment);
  let current = { ...grow };
  let harvested = false;
  let buds_earned = 0;

  // Phase fuer Phase durchlaufen
  while (true) {
    const phaseIdx = phases.findIndex(p => p.phase === current.phase);
    if (phaseIdx < 0) break;

    const phaseDef = phases[phaseIdx];
    // Live-Extraction ueberspringt Curing
    if (current.live_extraction && phaseDef.phase === 'curing') {
      harvested = true;
      break;
    }

    const phaseHours = phaseDef.hours / speedMult;
    const phaseMs = phaseHours * 3600 * 1000;
    const elapsed = now - current.phase_started_at;

    if (elapsed >= phaseMs) {
      // Phase fertig
      const nextPhaseIdx = phaseIdx + 1;
      if (nextPhaseIdx >= phases.length) {
        // Grow komplett!
        harvested = true;
        break;
      }
      current = {
        ...current,
        phase: phases[nextPhaseIdx].phase,
        phase_started_at: current.phase_started_at + phaseMs,
      };
    } else {
      break;
    }
  }

  if (harvested) {
    // Ertrag berechnen
    const yieldMult = spaceYieldMult(space, equipment);
    // Zwerg-Qualitaet beeinflusst Ertrag (0.5-1.0 basierend auf Anzahl besetzter Rollen)
    const spaceDef = getSpaceDef(space.type);
    const filledRoles = space.assigned_dwarves.length;
    const requiredRoles = spaceDef.required_roles.length;
    const dwerfQuality = requiredRoles > 0 ? Math.max(0.3, filledRoles / requiredRoles) : 0.5;

    const baseYield = strain.yield_min + (strain.yield_max - strain.yield_min) * dwerfQuality;
    buds_earned = Math.round(baseYield * yieldMult * current.plant_count);
  }

  return { grow: current, harvested, buds_earned };
}

// ─── STORE ──────────────────────────────────────────────────────────────

function createGameStore() {
  const { subscribe, set, update } = writable<GameState>(loadState());

  function doUpdate(fn: (s: GameState) => GameState): void {
    update(current => {
      const next = fn(current);
      persist(next);
      return next;
    });
  }

  return {
    subscribe,

    // ── OFFLINE TICK ──
    /** Progresse alle Grows bis jetzt (Offline-Aufholjagd) */
    tick() {
      doUpdate(s => {
        const now = Date.now();
        let buds = s.buds;
        let totalBudsEarned = s.total_buds_earned;
        let totalHarvests = s.total_harvests;
        const finishedGrowIds: string[] = [];
        let achLightBroke = s.ach_light_broke;

        // Grows ticken
        const updatedGrows = s.grows.map(g => {
          const space = s.spaces.find(sp => sp.id === g.space_id);
          if (!space) return g;
          const result = tickGrow(g, space, s.equipment, now);
          if (result.harvested) {
            finishedGrowIds.push(g.id);
            buds += result.buds_earned;
            totalBudsEarned += result.buds_earned;
            totalHarvests++;
            if (result.buds_earned > 0) {
              toastStore.show(result.buds_earned, `+${result.buds_earned} Buds geerntet!`);
            }
          }
          return result.grow;
        });

        // Equipment-Bruch pruefen bei beendeten Grows
        const updatedEquip = [...s.equipment];
        if (finishedGrowIds.length > 0) {
          for (const eq of updatedEquip) {
            if (eq.broken) continue;
            const def = getEquip(eq.equip_id);
            if (!def) continue;
            if (Math.random() < def.break_chance) {
              eq.broken = true;
              if (def.category === 'light') achLightBroke = true;
              toastStore.show(0, `${def.name} ist kaputt gegangen!`);
            }
          }
        }

        return {
          ...s,
          buds,
          total_buds_earned: totalBudsEarned,
          total_harvests: totalHarvests,
          grows: updatedGrows.filter(g => !finishedGrowIds.includes(g.id)),
          equipment: updatedEquip,
          last_tick: now,
          ach_light_broke: achLightBroke,
        };
      });
    },

    // ── SEEDS ──
    /** Seed zum Inventar hinzufuegen */
    addSeed(strainId: string, count: number = 1) {
      doUpdate(s => {
        const inv = [...s.seed_inventory];
        const existing = inv.find(si => si.strain_id === strainId);
        if (existing) {
          existing.count += count;
        } else {
          inv.push({ strain_id: strainId, count });
        }
        return { ...s, seed_inventory: inv };
      });
    },

    /** Seedpack kaufen (kostet Buds) */
    buySeedPack(packId: string): string[] {
      let result: string[] = [];
      update(s => {
        const pack = SEED_PACK_DEFS.find(p => p.id === packId);
        if (!pack || s.buds < pack.cost_buds) return s;

        const seeds: string[] = [];
        // Garantierter Seed: Rarity aus Pack-Definition
        if (pack.guaranteed_rarity) {
          const guaranteedPool = STRAIN_DEFS.filter(s => s.rarity === pack.guaranteed_rarity);
          if (guaranteedPool.length > 0) {
            seeds.push(guaranteedPool[Math.floor(Math.random() * guaranteedPool.length)].id);
          }
        }
        // Rest: nur vom Breeder des Packs
        while (seeds.length < pack.seed_count) {
          seeds.push(rollStrainFromPack(pack));
        }

        const inv = [...s.seed_inventory];
        for (const sid of seeds) {
          const existing = inv.find(si => si.strain_id === sid);
          if (existing) existing.count++;
          else inv.push({ strain_id: sid, count: 1 });
        }

        result = seeds;
        const next = {
          ...s,
          buds: s.buds - pack.cost_buds,
          seed_inventory: inv,
        };
        persist(next);
        return next;
      });
      return result;
    },

    /** Daily Login: 1x pro Tag — manchmal 1 Seed (immer wenn 0 Seeds) */
    dailySeedCheck() {
      doUpdate(s => {
        const today = new Date().toISOString().slice(0, 10);
        if (s.last_daily_check === today) return s; // bereits heute gelaufen

        const hasAnySeeds = s.seed_inventory.some(si => si.count > 0);
        const giveFreeSeed = !hasAnySeeds || Math.random() < 0.15;
        if (!giveFreeSeed) return { ...s, last_daily_check: today };

        const inv = [...s.seed_inventory];
        const ww = inv.find(si => si.strain_id === 'ww-auto');
        if (ww) {
          ww.count++;
        } else {
          inv.push({ strain_id: 'ww-auto', count: 1 });
        }
        toastStore.show(0, '+1 White Widow Auto Seed');
        return { ...s, seed_inventory: inv, last_daily_check: today };
      });
    },

    // ── SPACES ──
    /** Neuen Space kaufen */
    buySpace(type: SpaceType): boolean {
      let success = false;
      update(s => {
        const def = getSpaceDef(type);
        if (s.buds < def.cost_buds) return s;
        if (def.requires && !s.spaces.some(sp => sp.type === def.requires)) return s;
        // Prüfe ob Typ schon existiert
        if (s.spaces.some(sp => sp.type === type)) return s;

        success = true;
        const next = {
          ...s,
          buds: s.buds - def.cost_buds,
          spaces: [...s.spaces, {
            id: `space-${uid()}`,
            type,
            installed_equip: [],
            assigned_dwarves: [],
          }],
        };
        persist(next);
        return next;
      });
      return success;
    },

    /** Zwerg einem Space zuweisen */
    assignDwarf(spaceId: string, zwergId: number) {
      doUpdate(s => {
        const spaces = s.spaces.map(sp => {
          if (sp.id !== spaceId) return sp;
          const def = getSpaceDef(sp.type);
          if (sp.assigned_dwarves.length >= def.required_roles.length) return sp;
          if (sp.assigned_dwarves.includes(zwergId)) return sp;
          return { ...sp, assigned_dwarves: [...sp.assigned_dwarves, zwergId] };
        });
        return { ...s, spaces };
      });
    },

    /** Zwerg aus Space entfernen */
    removeDwarf(spaceId: string, zwergId: number) {
      doUpdate(s => {
        const spaces = s.spaces.map(sp => {
          if (sp.id !== spaceId) return sp;
          return { ...sp, assigned_dwarves: sp.assigned_dwarves.filter(id => id !== zwergId) };
        });
        return { ...s, spaces };
      });
    },

    // ── EQUIPMENT ──
    /** Equipment kaufen */
    buyEquip(equipId: string): boolean {
      let success = false;
      update(s => {
        const def = getEquip(equipId);
        if (!def || s.buds < def.cost_buds) return s;
        if (s.equipment.some(e => e.equip_id === equipId)) return s;

        success = true;
        const next = {
          ...s,
          buds: s.buds - def.cost_buds,
          equipment: [...s.equipment, { equip_id: equipId, broken: false }],
        };
        persist(next);
        return next;
      });
      return success;
    },

    /** Equipment in Space installieren */
    installEquip(spaceId: string, equipId: string) {
      doUpdate(s => {
        if (!s.equipment.some(e => e.equip_id === equipId)) return s;
        const spaces = s.spaces.map(sp => {
          if (sp.id !== spaceId) return sp;
          if (sp.installed_equip.includes(equipId)) return sp;
          // Nur 1 pro Kategorie
          const def = getEquip(equipId);
          if (!def) return sp;
          const filtered = sp.installed_equip.filter(eid => {
            const eDef = getEquip(eid);
            return eDef?.category !== def.category;
          });
          return { ...sp, installed_equip: [...filtered, equipId] };
        });
        return { ...s, spaces };
      });
    },

    /** Equipment reparieren */
    repairEquip(equipId: string): boolean {
      let success = false;
      update(s => {
        const eq = s.equipment.find(e => e.equip_id === equipId);
        if (!eq || !eq.broken) return s;
        const def = getEquip(equipId);
        if (!def || s.buds < def.repair_cost) return s;

        success = true;
        const equipment = s.equipment.map(e =>
          e.equip_id === equipId ? { ...e, broken: false } : e
        );
        const next = { ...s, buds: s.buds - def.repair_cost, equipment };
        persist(next);
        return next;
      });
      return success;
    },

    // ── GROWS ──
    /** Neuen Grow starten */
    startGrow(spaceId: string, strainId: string, plantCount: number, liveExtraction: boolean = false): boolean {
      let success = false;
      update(s => {
        const space = s.spaces.find(sp => sp.id === spaceId);
        if (!space) return s;

        // Prüfe ob Space frei (kein aktiver Grow)
        if (s.grows.some(g => g.space_id === spaceId)) return s;

        // Prüfe Zwerge gesetzt
        const spaceDef = getSpaceDef(space.type);
        if (space.assigned_dwarves.length < 1) return s;

        // Prüfe Pflanzenanzahl
        if (plantCount > spaceDef.max_plants || plantCount < 1) return s;

        // Prüfe Seeds verfügbar
        const inv = [...s.seed_inventory];
        const seedItem = inv.find(si => si.strain_id === strainId);
        if (!seedItem || seedItem.count < plantCount) return s;

        // Seeds verbrauchen
        seedItem.count -= plantCount;

        // Live-Extraction nur wenn passende Extraction vorhanden
        const canLive = liveExtraction && s.owned_extractions.some(eid => {
          const ext = getExtraction(eid);
          return ext?.skip_curing;
        });

        const now = Date.now();
        success = true;
        const next = {
          ...s,
          seed_inventory: inv.filter(si => si.count > 0),
          grows: [...s.grows, {
            id: `grow-${uid()}`,
            space_id: spaceId,
            strain_id: strainId,
            plant_count: plantCount,
            started_at: now,
            phase: 'keimung' as GrowPhase,
            phase_started_at: now,
            live_extraction: canLive,
          }],
        };
        persist(next);
        return next;
      });
      return success;
    },

    // ── EXTRACTION ──
    /** Extraction-Setup kaufen */
    buyExtraction(extId: string): boolean {
      let success = false;
      update(s => {
        const def = getExtraction(extId);
        if (!def || s.buds < def.cost_buds) return s;
        if (s.owned_extractions.includes(extId)) return s;
        if (def.requires && !s.owned_extractions.includes(def.requires)) return s;

        success = true;
        const next = {
          ...s,
          buds: s.buds - def.cost_buds,
          owned_extractions: [...s.owned_extractions, extId],
        };
        persist(next);
        return next;
      });
      return success;
    },

    /** Extraction durchfuehren (Buds → Wax) */
    runExtraction(extId: string): boolean {
      let success = false;
      update(s => {
        if (!s.owned_extractions.includes(extId)) return s;
        const def = getExtraction(extId);
        if (!def || s.buds < def.input_buds) return s;

        success = true;
        const waxEarned = def.output_wax_g;
        toastStore.show(0, `+${waxEarned}g Wax produziert!`);
        const next = {
          ...s,
          buds: s.buds - def.input_buds,
          wax: Math.round((s.wax + waxEarned) * 100) / 100,
          total_wax_produced: Math.round((s.total_wax_produced + waxEarned) * 100) / 100,
        };
        persist(next);
        return next;
      });
      return success;
    },

    // ── CURRENCIES ──
    /** Buds direkt hinzufuegen (z.B. durch Calc-Bonus) */
    addBuds(amount: number) {
      doUpdate(s => {
        if (amount > 0) toastStore.show(amount, `+${amount} Buds`);
        return { ...s, buds: s.buds + amount, total_buds_earned: s.total_buds_earned + Math.max(0, amount) };
      });
    },

    /** Log-Token verdienen (durch Calc-Log Eintraege) */
    addLogTokens(amount: number) {
      doUpdate(s => {
        toastStore.show(0, `+${amount} Log-Token`);
        return { ...s, log_tokens: s.log_tokens + amount };
      });
    },

    /** Wax in Buds umwandeln (1g Wax = 100 Buds) */
    convertWaxToBuds(waxAmount: number): boolean {
      let success = false;
      update(s => {
        if (s.wax < waxAmount) return s;
        success = true;
        const budsGained = Math.round(waxAmount * 100);
        const next = {
          ...s,
          wax: Math.round((s.wax - waxAmount) * 100) / 100,
          buds: s.buds + budsGained,
        };
        persist(next);
        return next;
      });
      return success;
    },

    // ── MIGRATION ──
    /** Fuer bestehende User: Seeds → Buds konvertieren (einmalig) */
    migrateFromOldSeeds(oldSeeds: number) {
      doUpdate(s => {
        if (oldSeeds <= 0) return s;
        // Alte Seeds 1:1 in Buds + Starter-Seed
        const inv = [...s.seed_inventory];
        if (!inv.some(si => si.strain_id === 'ww-auto')) {
          inv.push({ strain_id: 'ww-auto', count: 3 });
        }
        return {
          ...s,
          buds: s.buds + oldSeeds,
          seed_inventory: inv,
        };
      });
    },

    /** State aus Sheet laden */
    loadFromSheet(remote: Partial<GameState>) {
      doUpdate(s => ({
        ...s,
        buds: Math.max(s.buds, remote.buds ?? 0),
        wax: Math.max(s.wax, remote.wax ?? 0),
        log_tokens: Math.max(s.log_tokens, remote.log_tokens ?? 0),
        total_harvests: Math.max(s.total_harvests, remote.total_harvests ?? 0),
        total_buds_earned: Math.max(s.total_buds_earned, remote.total_buds_earned ?? 0),
        total_wax_produced: Math.max(s.total_wax_produced, remote.total_wax_produced ?? 0),
      }));
    },

    reset() {
      const fresh = { ...DEFAULTS, last_tick: Date.now() };
      persist(fresh);
      set(fresh);
    },
  };
}

export const gameStore = createGameStore();

// ─── DERIVED ────────────────────────────────────────────────────────────

export const activeGrows = derived(gameStore, $s => $s.grows);
export const totalBuds = derived(gameStore, $s => $s.buds);
export const totalWax = derived(gameStore, $s => $s.wax);

/** Grow-Fortschritt als Prozent (0-100). Mit spaces/equipment wird Speed-Mult beruecksichtigt. */
export function getGrowProgress(grow: ActiveGrow, spaces?: GrowSpace[], equipment?: OwnedEquip[]): number {
  const strain = getStrain(grow.strain_id);
  if (!strain) return 0;
  let speedMult = 1;
  if (spaces && equipment) {
    const space = spaces.find(sp => sp.id === grow.space_id);
    if (space) speedMult = spaceSpeedMult(space, equipment);
  }
  const phases = getPhasesForType(strain.type);
  const totalMs = phases.reduce((s, p) => s + (p.hours / speedMult) * 3600000, 0);
  const elapsed = Date.now() - grow.started_at;
  return Math.min(100, Math.round((elapsed / totalMs) * 100));
}

/** Verbleibende Zeit eines Grows als lesbarer String. Mit spaces/equipment wird Speed-Mult beruecksichtigt. */
export function getGrowTimeLeft(grow: ActiveGrow, spaces?: GrowSpace[], equipment?: OwnedEquip[]): string {
  const strain = getStrain(grow.strain_id);
  if (!strain) return '?';
  let speedMult = 1;
  if (spaces && equipment) {
    const space = spaces.find(sp => sp.id === grow.space_id);
    if (space) speedMult = spaceSpeedMult(space, equipment);
  }
  const phases = getPhasesForType(strain.type);
  const totalMs = phases.reduce((s, p) => s + (p.hours / speedMult) * 3600000, 0);
  const elapsed = Date.now() - grow.started_at;
  const remaining = Math.max(0, totalMs - elapsed);
  const hours = Math.floor(remaining / 3600000);
  const mins = Math.floor((remaining % 3600000) / 60000);
  if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}
