/**
 * Strain-Definitionen — Breeder-basierte Seedpacks
 * Rarity bestimmt Qualitaet/Ertrag, Auto vs Photo bestimmt Grow-Zeit.
 */

import type { Rarity } from '../stores/zwerge';

export type StrainType = 'auto' | 'photo';

export interface StrainDef {
  id: string;
  name: string;
  breeder: string;
  type: StrainType;
  rarity: Rarity;
  /** Basis-Ertrag in Gramm (min) bei schlechter Pflege */
  yield_min: number;
  /** Basis-Ertrag in Gramm (max) bei perfekter Pflege */
  yield_max: number;
  /** Grow-Dauer in Stunden (Auto kuerzer als Photo) */
  grow_hours: number;
  flavor: string;
}

// ─── PHASEN-TIMING ────────────────────────────────────────────────────

export type GrowPhase = 'keimung' | 'veg' | 'bluete' | 'trocknung' | 'curing';

export interface PhaseTiming {
  phase: GrowPhase;
  hours: number;
}

/** Photoperiodische: 14 Tage = 336h */
export const PHOTO_PHASES: PhaseTiming[] = [
  { phase: 'keimung',   hours: 48 },   // 2 Tage
  { phase: 'veg',       hours: 96 },   // 4 Tage
  { phase: 'bluete',    hours: 120 },  // 5 Tage
  { phase: 'trocknung', hours: 24 },   // 1 Tag
  { phase: 'curing',    hours: 48 },   // 2 Tage
];

/** Automatics: 10 Tage = 240h */
export const AUTO_PHASES: PhaseTiming[] = [
  { phase: 'keimung',   hours: 36 },   // 1.5 Tage
  { phase: 'veg',       hours: 60 },   // 2.5 Tage
  { phase: 'bluete',    hours: 84 },   // 3.5 Tage
  { phase: 'trocknung', hours: 24 },   // 1 Tag
  { phase: 'curing',    hours: 36 },   // 1.5 Tage
];

export function getPhasesForType(type: StrainType): PhaseTiming[] {
  return type === 'auto' ? AUTO_PHASES : PHOTO_PHASES;
}

export function getTotalGrowHours(type: StrainType): number {
  return getPhasesForType(type).reduce((s, p) => s + p.hours, 0);
}

export const PHASE_LABELS: Record<GrowPhase, string> = {
  keimung: 'Keimung',
  veg: 'Vegetation',
  bluete: 'Bluete',
  trocknung: 'Trocknung',
  curing: 'Curing',
};

// ─── STRAIN-DEFINITIONEN ──────────────────────────────────────────────

export const STRAIN_DEFS: StrainDef[] = [
  // ── COMMON — FastBuds, Sweet Seeds (Mainstream) ──
  { id: 'ww-auto',       name: 'White Widow Auto',      breeder: 'FastBuds',     type: 'auto',  rarity: 'common', yield_min: 4,  yield_max: 35,  grow_hours: 240, flavor: 'Klassiker, mild, erdig' },
  { id: 'nl-auto',       name: 'Northern Lights Auto',   breeder: 'Sweet Seeds',  type: 'auto',  rarity: 'common', yield_min: 5,  yield_max: 40,  grow_hours: 240, flavor: 'Suess, Kiefer, entspannend' },
  { id: 'amnesia-auto',  name: 'Amnesia Haze Auto',      breeder: 'FastBuds',     type: 'auto',  rarity: 'common', yield_min: 4,  yield_max: 38,  grow_hours: 240, flavor: 'Zitrus, Haze, energetisch' },
  { id: 'cream-auto',    name: 'Cream Caramel Auto',     breeder: 'Sweet Seeds',  type: 'auto',  rarity: 'common', yield_min: 5,  yield_max: 42,  grow_hours: 240, flavor: 'Karamell, suess, cremig' },
  { id: 'ww-photo',      name: 'White Widow',            breeder: 'FastBuds',     type: 'photo', rarity: 'common', yield_min: 6,  yield_max: 55,  grow_hours: 336, flavor: 'Erdig, harzig, Klassiker' },
  { id: 'nl-photo',      name: 'Northern Lights',        breeder: 'Sweet Seeds',  type: 'photo', rarity: 'common', yield_min: 8,  yield_max: 60,  grow_hours: 336, flavor: 'Suess, entspannend, Indica' },

  // ── RARE — Humboldt, Homegrown ──
  { id: 'blueberry-photo', name: 'Blueberry Muffin',     breeder: 'Humboldt',     type: 'photo', rarity: 'rare', yield_min: 12, yield_max: 100, grow_hours: 336, flavor: 'Blaubeere, Muffin, fruchtig' },
  { id: 'purple-auto',     name: 'Purple Punch Auto',    breeder: 'Homegrown',    type: 'auto',  rarity: 'rare', yield_min: 10, yield_max: 75,  grow_hours: 240, flavor: 'Traube, Punch, sedativ' },
  { id: 'train-photo',     name: 'Trainwreck',           breeder: 'Humboldt',     type: 'photo', rarity: 'rare', yield_min: 15, yield_max: 110, grow_hours: 336, flavor: 'Zitrone, Pfeffer, stark' },
  { id: 'gelato-auto',     name: 'Gelato Auto',          breeder: 'Homegrown',    type: 'auto',  rarity: 'rare', yield_min: 10, yield_max: 80,  grow_hours: 240, flavor: 'Gelato, cremig, suess' },
  { id: 'zkittlez-photo',  name: 'Zkittlez',             breeder: 'Humboldt',     type: 'photo', rarity: 'rare', yield_min: 14, yield_max: 105, grow_hours: 336, flavor: 'Frucht-Mix, Regenbogen, entspannend' },

  // ── EPIC — Grounded ──
  { id: 'apples-photo',    name: 'Apples & Bananas',     breeder: 'Grounded',     type: 'photo', rarity: 'epic', yield_min: 25, yield_max: 200, grow_hours: 336, flavor: 'Frucht-Explosion, Gas, Premium' },
  { id: 'grape-photo',     name: 'Grape Gasoline',       breeder: 'Grounded',     type: 'photo', rarity: 'epic', yield_min: 22, yield_max: 190, grow_hours: 336, flavor: 'Traube, Diesel, potent' },
  { id: 'sunset-auto',     name: 'Sunset Sherbet Auto',  breeder: 'Grounded',     type: 'auto',  rarity: 'epic', yield_min: 18, yield_max: 130, grow_hours: 240, flavor: 'Sherbet, suess, bunt' },

  // ── LEGENDARY — Square One Genetics ──
  { id: 'mac-photo',       name: 'MAC 1',                breeder: 'Square One',   type: 'photo', rarity: 'legendary', yield_min: 40, yield_max: 350, grow_hours: 336, flavor: 'Miracle Alien Cookies, perfekt' },
  { id: 'jealousy-photo',  name: 'Jealousy',             breeder: 'Square One',   type: 'photo', rarity: 'legendary', yield_min: 35, yield_max: 320, grow_hours: 336, flavor: 'Gelato x Sherbet, Elite-Genetik' },
];

export function getStrain(id: string): StrainDef | undefined {
  return STRAIN_DEFS.find(s => s.id === id);
}

export function getStrainsByRarity(rarity: Rarity): StrainDef[] {
  return STRAIN_DEFS.filter(s => s.rarity === rarity);
}

export function getStrainsByBreeder(breeder: string): StrainDef[] {
  return STRAIN_DEFS.filter(s => s.breeder === breeder);
}

export const BREEDERS = [...new Set(STRAIN_DEFS.map(s => s.breeder))];

// ─── SEEDPACK-DEFINITIONEN ────────────────────────────────────────────

export interface SeedPackDef {
  id: string;
  label: string;
  breeder: string;
  cost_buds: number;
  seed_count: number;
  /** Garantierte Rarity (mindestens 1 Seed dieser Stufe) */
  guaranteed_rarity: Rarity | null;
  rarity: Rarity;
}

export const SEED_PACK_DEFS: SeedPackDef[] = [
  // Common Packs
  { id: 'pack-fastbuds',   label: 'FastBuds Starter',    breeder: 'FastBuds',    cost_buds: 15,   seed_count: 3, guaranteed_rarity: null,     rarity: 'common' },
  { id: 'pack-sweet',      label: 'Sweet Seeds Mix',     breeder: 'Sweet Seeds', cost_buds: 18,   seed_count: 3, guaranteed_rarity: null,     rarity: 'common' },
  // Rare Packs
  { id: 'pack-humboldt',   label: 'Humboldt Collection', breeder: 'Humboldt',    cost_buds: 60,   seed_count: 3, guaranteed_rarity: 'rare',   rarity: 'rare' },
  { id: 'pack-homegrown',  label: 'Homegrown Premium',   breeder: 'Homegrown',   cost_buds: 55,   seed_count: 3, guaranteed_rarity: 'rare',   rarity: 'rare' },
  // Epic Packs
  { id: 'pack-grounded',   label: 'Grounded Exotics',    breeder: 'Grounded',    cost_buds: 200,  seed_count: 2, guaranteed_rarity: 'epic',   rarity: 'epic' },
  // Legendary Packs
  { id: 'pack-squareone',  label: 'Square One Genetics',  breeder: 'Square One', cost_buds: 800,  seed_count: 2, guaranteed_rarity: 'legendary', rarity: 'legendary' },
];

/** Zufaelligen Strain aus Seedpack rollen */
export function rollStrainFromPack(pack: SeedPackDef): string {
  const pool = pack.guaranteed_rarity
    ? STRAIN_DEFS.filter(s => s.breeder === pack.breeder || s.rarity === pack.guaranteed_rarity)
    : STRAIN_DEFS.filter(s => s.breeder === pack.breeder);
  if (pool.length === 0) return STRAIN_DEFS[0].id;
  return pool[Math.floor(Math.random() * pool.length)].id;
}
