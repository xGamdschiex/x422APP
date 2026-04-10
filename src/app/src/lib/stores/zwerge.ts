/**
 * Zwergenbrigade — Gamification Store
 * Sammelbare Pixel-Art Zwerge als Kartensystem + Grow-Rollen.
 * Alte 30 Zwerge bleiben erhalten, neue Rollen-Zwerge ab ID 31.
 * Leveling: 10x gleiche Karte = Level 2, Max Level 20.
 */
import { writable, derived } from 'svelte/store';
import { toastStore } from './toast';
import type { ZwergRole } from '../data/equipment';

// ─── TYPES ──────────────────────────────────────────────────────────────

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export type BuffTrigger =
  | 'log_save' | 'mix_complete' | 'daily_login' | 'phase_change'
  | 'has_ph' | 'has_ec' | 'has_notiz'
  | 'medium_coco' | 'medium_hydro' | 'medium_erde' | 'has_ro'
  | 'bloom_phase' | 'veg_phase' | 'flush_phase' | 'bloom_w5plus'
  | 'feedline_change' | 'new_strain' | 'night_login'
  | 'streak_7' | 'grow_complete' | 'offline_sync' | 'extraction_run'
  | 'passive' | 'pack_open' | 'none';

export type BuffMode = 'add' | 'multiply' | 'pack_cards' | 'pack_discount';

export interface ZwergDef {
  id: number;
  name: string;
  rolle: string;
  rarity: Rarity;
  buff_trigger: BuffTrigger;
  buff_mode: BuffMode;
  buff_value: number;
  buff_label: string;
  /** Grow-Rolle fuer Space-Zuweisung (neue Zwerge ab ID 31) */
  grow_role?: ZwergRole;
}

export interface OwnedZwerg {
  id: number;
  count: number;
  obtained_at: string;
  /** Level: 10 Karten = Level 2, max Level 20 */
  level: number;
}

/** Karten fuer naechstes Level berechnen */
export function cardsForLevel(level: number): number {
  return level * 10; // Level 1→2: 10 Karten, Level 2→3: 20 Karten, etc.
}

/** Buff-Wert mit Level-Bonus berechnen */
export function buffWithLevel(baseValue: number, level: number, mode: BuffMode): number {
  if (mode === 'multiply') {
    // Multiplikator: +2% pro Level (Level 1 = Basis, Level 20 = +38%)
    return baseValue + (level - 1) * 0.02;
  }
  if (mode === 'pack_discount') {
    // Discount: -1% pro Level extra
    return Math.max(0.5, baseValue - (level - 1) * 0.01);
  }
  // Add: +0.5 pro Level (abgerundet)
  return baseValue + Math.floor((level - 1) * 0.5);
}

export const MAX_ZWERG_LEVEL = 20;

export type PackTier = 'daily' | 'naehrstoff' | 'golden' | 'legenden';

export interface PackDef {
  tier: PackTier;
  label: string;
  card_count: number;
  cost: number;
  guaranteed_rarity: Rarity | null;
}

export interface GamificationState {
  seeds: number;
  owned: OwnedZwerg[];
  active_ids: number[];
  last_daily_claim: string;
  last_login_date: string;
  login_streak: number;
  total_logs: number;
  total_mixes: number;
  total_packs_opened: number;
  known_strains: string[];
  last_pack_result: number[] | null;
  /** Migration: wurden alte Seeds schon konvertiert? */
  v2_migrated: boolean;
}

// ─── ZWERG-DEFINITIONEN (30 Stück) ─────────────────────────────────────

export const ZWERG_DEFS: ZwergDef[] = [
  // ── COMMON (12) ──
  { id: 1,  name: 'Tropfi',      rolle: 'Giesser',            rarity: 'common', buff_trigger: 'log_save',       buff_mode: 'add', buff_value: 1, buff_label: '+1 Seed pro Log' },
  { id: 2,  name: 'Keiml',       rolle: 'Keimlings-Hueter',   rarity: 'common', buff_trigger: 'phase_change',   buff_mode: 'add', buff_value: 1, buff_label: '+1 Seed bei Phase-Wechsel' },
  { id: 3,  name: 'Kruemmel',    rolle: 'Substrat-Mischer',   rarity: 'common', buff_trigger: 'medium_coco',    buff_mode: 'add', buff_value: 1, buff_label: '+1 Seed bei Coco' },
  { id: 4,  name: 'Ruehrer',     rolle: 'Misch-Geselle',      rarity: 'common', buff_trigger: 'mix_complete',   buff_mode: 'add', buff_value: 1, buff_label: '+1 Seed pro Mix' },
  { id: 5,  name: 'Wuzzel',      rolle: 'Wurzel-Pfleger',     rarity: 'common', buff_trigger: 'daily_login',    buff_mode: 'add', buff_value: 1, buff_label: '+1 Seed bei Login' },
  { id: 6,  name: 'Wolki',       rolle: 'Sync-Waechter',      rarity: 'common', buff_trigger: 'offline_sync',   buff_mode: 'add', buff_value: 1, buff_label: '+1 Seed bei Sync' },
  { id: 7,  name: 'Rohri',       rolle: 'Leitungs-Pruefer',   rarity: 'common', buff_trigger: 'has_ro',         buff_mode: 'add', buff_value: 1, buff_label: '+1 Seed mit RO' },
  { id: 8,  name: 'Giesela',     rolle: 'Giess-Assistentin',  rarity: 'common', buff_trigger: 'streak_7',       buff_mode: 'add', buff_value: 1, buff_label: '+1 Seed bei 7d Streak' },
  { id: 9,  name: 'Schippchen',  rolle: 'Erde-Schaufler',     rarity: 'common', buff_trigger: 'medium_erde',    buff_mode: 'add', buff_value: 1, buff_label: '+1 Seed bei Erde' },
  { id: 10, name: 'Pressbert',   rolle: 'Extrakt-Lehrling',     rarity: 'common', buff_trigger: 'extraction_run', buff_mode: 'add', buff_value: 1, buff_label: '+1 Seed pro Extraktion' },
  { id: 11, name: 'Blubber',     rolle: 'Airstone-Wart',      rarity: 'common', buff_trigger: 'medium_hydro',   buff_mode: 'add', buff_value: 1, buff_label: '+1 Seed bei Hydro' },
  { id: 12, name: 'Nachti',      rolle: 'Nacht-Eule',         rarity: 'common', buff_trigger: 'night_login',    buff_mode: 'add', buff_value: 1, buff_label: '+1 Seed bei Nacht-Login' },
  // ── RARE (9) ──
  { id: 13, name: 'Professor pH',  rolle: 'pH-Meister',       rarity: 'rare', buff_trigger: 'has_ph',          buff_mode: 'add', buff_value: 2, buff_label: '+2 Seeds mit pH-Wert' },
  { id: 14, name: 'EC-Elmar',      rolle: 'EC-Kontrolleur',   rarity: 'rare', buff_trigger: 'has_ec',          buff_mode: 'add', buff_value: 2, buff_label: '+2 Seeds mit EC-Wert' },
  { id: 15, name: 'Tintenbart',    rolle: 'Protokoll-Meister',  rarity: 'rare', buff_trigger: 'log_save',       buff_mode: 'add', buff_value: 2, buff_label: '+2 Seeds pro Log' },
  { id: 16, name: 'Wandler',       rolle: 'Phasen-Dirigent',  rarity: 'rare', buff_trigger: 'phase_change',    buff_mode: 'add', buff_value: 2, buff_label: '+2 Seeds bei Phase-Wechsel' },
  { id: 17, name: 'Flora',         rolle: 'Bluete-Gaertnerin', rarity: 'rare', buff_trigger: 'bloom_phase',    buff_mode: 'add', buff_value: 2, buff_label: '+2 Seeds in Bloom' },
  { id: 18, name: 'Veggie',        rolle: 'Veg-Spezialist',   rarity: 'rare', buff_trigger: 'veg_phase',       buff_mode: 'add', buff_value: 2, buff_label: '+2 Seeds in Veg' },
  { id: 19, name: 'Mixer Max',     rolle: 'Mix-Meister',      rarity: 'rare', buff_trigger: 'mix_complete',    buff_mode: 'add', buff_value: 3, buff_label: '+3 Seeds pro Mix' },
  { id: 20, name: 'Notizbold',     rolle: 'Protokollant',     rarity: 'rare', buff_trigger: 'has_notiz',       buff_mode: 'add', buff_value: 2, buff_label: '+2 Seeds mit Notiz' },
  { id: 21, name: 'Schichtmeister', rolle: 'Schicht-Planer',  rarity: 'rare', buff_trigger: 'daily_login',     buff_mode: 'add', buff_value: 2, buff_label: '+2 Seeds bei Login' },
  // ── EPIC (6) ──
  { id: 22, name: 'Goldblatt',         rolle: 'Ernte-Meister',        rarity: 'epic', buff_trigger: 'flush_phase',     buff_mode: 'add', buff_value: 5, buff_label: '+5 Seeds bei Flush' },
  { id: 23, name: 'Kristallbart',      rolle: 'Trichom-Inspektor',    rarity: 'epic', buff_trigger: 'bloom_w5plus',    buff_mode: 'add', buff_value: 5, buff_label: '+5 Seeds ab Bloom W5' },
  { id: 24, name: 'Alchimist Rupert',  rolle: 'Naehrstoff-Alchemist', rarity: 'epic', buff_trigger: 'feedline_change', buff_mode: 'add', buff_value: 4, buff_label: '+4 Seeds bei Line-Wechsel' },
  { id: 25, name: 'Dampfzwerg Hilda',  rolle: 'Trocknungs-Expertin',  rarity: 'epic', buff_trigger: 'grow_complete',   buff_mode: 'add', buff_value: 5, buff_label: '+5 Seeds bei Grow-Ende' },
  { id: 26, name: 'Strain-Jaeger',     rolle: 'Sorten-Experte',       rarity: 'epic', buff_trigger: 'new_strain',      buff_mode: 'add', buff_value: 3, buff_label: '+3 Seeds neuer Strain' },
  { id: 27, name: 'Wache Gerd',        rolle: 'Nacht-Waechter',       rarity: 'epic', buff_trigger: 'night_login',     buff_mode: 'add', buff_value: 4, buff_label: '+4 Seeds Nacht-Login' },
  // ── LEGENDARY (3) ──
  { id: 28, name: 'Meister Gruenthumb', rolle: 'Garten-Patriarch',    rarity: 'legendary', buff_trigger: 'passive',    buff_mode: 'multiply',      buff_value: 1.1,  buff_label: 'Alle Seeds +10%' },
  { id: 29, name: 'Koenigin Indica',    rolle: 'Herrscherin der Ruhe', rarity: 'legendary', buff_trigger: 'pack_open',  buff_mode: 'pack_cards',    buff_value: 1,    buff_label: '+1 Karte pro Pack' },
  { id: 30, name: 'Sativa-Schamane',    rolle: 'Der Erleuchtete',      rarity: 'legendary', buff_trigger: 'pack_open',  buff_mode: 'pack_discount', buff_value: 0.85, buff_label: 'Pack-Kosten -15%' },

  // ── NEUE ROLLEN-ZWERGE (ab ID 31) — fuer Grow-Spaces ──
  // GENERAL (Fensterbank)
  { id: 31, name: 'Hansi',             rolle: 'Allround-Helfer',       rarity: 'common',    buff_trigger: 'grow_complete', buff_mode: 'add', buff_value: 2,  buff_label: '+2 Buds bei Ernte',     grow_role: 'general' },
  { id: 32, name: 'Gruener Gustav',    rolle: 'Gaertner-Geselle',      rarity: 'rare',      buff_trigger: 'grow_complete', buff_mode: 'add', buff_value: 5,  buff_label: '+5 Buds bei Ernte',     grow_role: 'general' },
  { id: 33, name: 'Pflanzenpaul',      rolle: 'Pflanzenfluester',      rarity: 'epic',      buff_trigger: 'passive',       buff_mode: 'multiply', buff_value: 1.05, buff_label: 'Ertrag +5%',    grow_role: 'general' },
  { id: 34, name: 'Meister Magnus',    rolle: 'Meistergaertner',       rarity: 'legendary', buff_trigger: 'passive',       buff_mode: 'multiply', buff_value: 1.12, buff_label: 'Ertrag +12%',   grow_role: 'general' },

  // VPD MANAGER
  { id: 35, name: 'Nebel-Nils',        rolle: 'Nebel-Techniker',       rarity: 'common',    buff_trigger: 'passive',       buff_mode: 'add', buff_value: 1,  buff_label: '+1 Bud passiv',         grow_role: 'vpd_manager' },
  { id: 36, name: 'Dampf-Dieter',      rolle: 'Dampf-Kontrolleur',     rarity: 'rare',      buff_trigger: 'passive',       buff_mode: 'multiply', buff_value: 1.04, buff_label: 'Ertrag +4%',    grow_role: 'vpd_manager' },
  { id: 37, name: 'Klima-Klara',       rolle: 'Klima-Expertin',        rarity: 'epic',      buff_trigger: 'passive',       buff_mode: 'multiply', buff_value: 1.08, buff_label: 'Ertrag +8%',    grow_role: 'vpd_manager' },
  { id: 38, name: 'VPD-Viktor',        rolle: 'VPD-Virtuose',          rarity: 'legendary', buff_trigger: 'passive',       buff_mode: 'multiply', buff_value: 1.15, buff_label: 'Ertrag +15%',   grow_role: 'vpd_manager' },

  // NUTRIENT MANAGER
  { id: 39, name: 'Duenger-Didi',      rolle: 'Duenger-Helfer',        rarity: 'common',    buff_trigger: 'mix_complete',  buff_mode: 'add', buff_value: 2,  buff_label: '+2 Buds pro Mix',       grow_role: 'nutrient_manager' },
  { id: 40, name: 'Naehrstoff-Nina',   rolle: 'Naehrstoff-Expertin',   rarity: 'rare',      buff_trigger: 'passive',       buff_mode: 'multiply', buff_value: 1.04, buff_label: 'Ertrag +4%',    grow_role: 'nutrient_manager' },
  { id: 41, name: 'Mineral-Moritz',    rolle: 'Mineral-Meister',       rarity: 'epic',      buff_trigger: 'passive',       buff_mode: 'multiply', buff_value: 1.08, buff_label: 'Ertrag +8%',    grow_role: 'nutrient_manager' },
  { id: 42, name: 'Elementar-Elsa',    rolle: 'Elementar-Alchemistin', rarity: 'legendary', buff_trigger: 'passive',       buff_mode: 'multiply', buff_value: 1.15, buff_label: 'Ertrag +15%',   grow_role: 'nutrient_manager' },

  // LIGHT MANAGER
  { id: 43, name: 'Lampen-Lars',       rolle: 'Lampen-Wart',           rarity: 'common',    buff_trigger: 'passive',       buff_mode: 'add', buff_value: 1,  buff_label: '+1 Bud passiv',         grow_role: 'light_manager' },
  { id: 44, name: 'Photon-Phil',       rolle: 'Photon-Techniker',      rarity: 'rare',      buff_trigger: 'passive',       buff_mode: 'multiply', buff_value: 1.04, buff_label: 'Ertrag +4%',    grow_role: 'light_manager' },
  { id: 45, name: 'Lumen-Lotte',       rolle: 'Lumen-Meisterin',       rarity: 'epic',      buff_trigger: 'passive',       buff_mode: 'multiply', buff_value: 1.08, buff_label: 'Ertrag +8%',    grow_role: 'light_manager' },
  { id: 46, name: 'Spektral-Sigi',     rolle: 'Spektral-Genie',        rarity: 'legendary', buff_trigger: 'passive',       buff_mode: 'multiply', buff_value: 1.15, buff_label: 'Ertrag +15%',   grow_role: 'light_manager' },

  // QUALITY MANAGER
  { id: 47, name: 'Pruefer-Pit',       rolle: 'Qualitaets-Pruefer',    rarity: 'common',    buff_trigger: 'grow_complete', buff_mode: 'add', buff_value: 3,  buff_label: '+3 Buds bei Ernte',     grow_role: 'quality_manager' },
  { id: 48, name: 'Qualitaets-Quinn',  rolle: 'Qualitaets-Experte',    rarity: 'rare',      buff_trigger: 'passive',       buff_mode: 'multiply', buff_value: 1.05, buff_label: 'Ertrag +5%',    grow_role: 'quality_manager' },
  { id: 49, name: 'Trichom-Tina',      rolle: 'Trichom-Inspektorin',   rarity: 'epic',      buff_trigger: 'passive',       buff_mode: 'multiply', buff_value: 1.10, buff_label: 'Ertrag +10%',   grow_role: 'quality_manager' },
  { id: 50, name: 'Connoisseur Carlo', rolle: 'Connoisseur',           rarity: 'legendary', buff_trigger: 'passive',       buff_mode: 'multiply', buff_value: 1.18, buff_label: 'Ertrag +18%',   grow_role: 'quality_manager' },

  // PEST CONTROLLER
  { id: 51, name: 'Kaefer-Karl',       rolle: 'Schaedlings-Jaeger',    rarity: 'common',    buff_trigger: 'passive',       buff_mode: 'add', buff_value: 1,  buff_label: '+1 Bud passiv',         grow_role: 'pest_controller' },
  { id: 52, name: 'Neem-Norbert',      rolle: 'Bio-Schuetzer',         rarity: 'rare',      buff_trigger: 'passive',       buff_mode: 'multiply', buff_value: 1.04, buff_label: 'Ertrag +4%',    grow_role: 'pest_controller' },
  { id: 53, name: 'Raeuber-Rosa',      rolle: 'Marienkaefer-Reiterin', rarity: 'epic',      buff_trigger: 'passive',       buff_mode: 'multiply', buff_value: 1.08, buff_label: 'Ertrag +8%',    grow_role: 'pest_controller' },
  { id: 54, name: 'Bio-Baron Boris',   rolle: 'Bio-Festungs-Meister',  rarity: 'legendary', buff_trigger: 'passive',       buff_mode: 'multiply', buff_value: 1.15, buff_label: 'Ertrag +15%',   grow_role: 'pest_controller' },

  // ── EXTRAKTIONS-ZWERGE (Sammelkarten, ab ID 55) ──
  { id: 55, name: 'Rosin-Rudi',       rolle: 'Rosin-Spezialist',     rarity: 'rare',      buff_trigger: 'extraction_run', buff_mode: 'add',      buff_value: 2,    buff_label: '+2 Seeds pro Extraktion' },
  { id: 56, name: 'Destillat-Dora',   rolle: 'Extrakt-Meisterin',    rarity: 'epic',      buff_trigger: 'extraction_run', buff_mode: 'add',      buff_value: 4,    buff_label: '+4 Seeds pro Extraktion' },
  { id: 57, name: 'Terpen-Titan',     rolle: 'Herr der Essenzen',    rarity: 'legendary', buff_trigger: 'extraction_run', buff_mode: 'multiply', buff_value: 1.2,  buff_label: 'Extrakt-Seeds +20%' },
];

// ─── PACK-DEFINITIONEN ──────────────────────────────────────────────────

export const PACK_DEFS: PackDef[] = [
  { tier: 'daily',      label: 'Taegliches Pack',  card_count: 3, cost: 0,   guaranteed_rarity: null },
  { tier: 'naehrstoff', label: 'Naehrstoff-Pack',   card_count: 5, cost: 50,  guaranteed_rarity: 'rare' },
  { tier: 'golden',     label: 'Goldenes Pack',     card_count: 5, cost: 150, guaranteed_rarity: 'epic' },
  { tier: 'legenden',   label: 'Legenden-Pack',     card_count: 7, cost: 500, guaranteed_rarity: 'legendary' },
];

/** Spezial-Packs die mit Log-Tokens gekauft werden (Calc-Nutzung) */
export type CalcPackTier = 'calc_basic' | 'calc_premium';

export interface CalcPackDef {
  tier: CalcPackTier;
  label: string;
  card_count: number;
  cost_tokens: number;
  guaranteed_rarity: Rarity | null;
}

export const CALC_PACK_DEFS: CalcPackDef[] = [
  { tier: 'calc_basic',   label: 'Calc-Pack',          card_count: 3, cost_tokens: 5,  guaranteed_rarity: 'rare' },
  { tier: 'calc_premium', label: 'Premium Calc-Pack',   card_count: 5, cost_tokens: 15, guaranteed_rarity: 'epic' },
];

/** Zwerge nach Grow-Rolle filtern */
export function getZwergeByRole(role: import('../data/equipment').ZwergRole): ZwergDef[] {
  return ZWERG_DEFS.filter(z => z.grow_role === role);
}

// ─── DROP-RATEN ─────────────────────────────────────────────────────────

const DROP_WEIGHTS: Record<Rarity, number> = {
  common: 60,
  rare: 25,
  epic: 12,
  legendary: 3,
};

export const KOMPOST_VALUES: Record<Rarity, number> = {
  common: 3,
  rare: 8,
  epic: 25,
  legendary: 80,
};

export const RARITY_LABELS: Record<Rarity, string> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendaer',
};

export const RARITY_COLORS: Record<Rarity, string> = {
  common: 'text-grow-muted',
  rare: 'text-grow-water',
  epic: 'text-purple-400',
  legendary: 'text-yellow-400',
};

export const RARITY_BG: Record<Rarity, string> = {
  common: 'border-grow-muted/30',
  rare: 'border-grow-water/40',
  epic: 'border-purple-500/40',
  legendary: 'border-yellow-400/40',
};

// ─── HELPERS ────────────────────────────────────────────────────────────

export function getZwerg(id: number): ZwergDef | undefined {
  return ZWERG_DEFS.find(z => z.id === id);
}

export function getZwergeByRarity(rarity: Rarity): ZwergDef[] {
  return ZWERG_DEFS.filter(z => z.rarity === rarity);
}

/** Feste Arbeits-Aktion pro Zwerg basierend auf Rolle */
const ROLLE_ACTION_MAP: Record<string, string> = {
  'Giesser': 'water',
  'Reservoir-Wart': 'water',
  'Substrat-Mischer': 'spray',
  'Topf-Traeger': 'thumbsup',
  'Wurzel-Pfleger': 'inspect',
  'Pumpen-Techniker': 'measure',
  'Leitungs-Pruefer': 'measure',
  'Giess-Assistentin': 'water',
  'Erde-Schaufler': 'spray',
  'Bewaesserungs-Helfer': 'water',
  'Airstone-Wart': 'spray',
  'Anfaenger-Zwerg': 'thumbsup',
  'pH-Meister': 'measure',
  'EC-Kontrolleur': 'measure',
  'CalMag-Spezialist': 'spray',
  'Licht-Waechter': 'inspect',
  'Bluete-Gaertnerin': 'inspect',
  'Veg-Spezialist': 'spray',
  'Mix-Meister': 'water',
  'Protokollant': 'inspect',
  'Schicht-Planer': 'thumbsup',
  'Ernte-Meister': 'harvest',
  'Trichom-Inspektor': 'inspect',
  'Naehrstoff-Alchemist': 'measure',
  'Trocknungs-Expertin': 'harvest',
  'Sorten-Experte': 'inspect',
  'Nacht-Waechter': 'inspect',
  'Garten-Patriarch': 'thumbsup',
  'Herrscherin der Ruhe': 'amazed',
  'Der Erleuchtete': 'dance',
  // Neue Rollen-Zwerge
  'Allround-Helfer': 'water',
  'Gaertner-Geselle': 'spray',
  'Pflanzenfluester': 'inspect',
  'Meistergaertner': 'thumbsup',
  'Nebel-Techniker': 'spray',
  'Dampf-Kontrolleur': 'measure',
  'Klima-Expertin': 'measure',
  'VPD-Virtuose': 'inspect',
  'Duenger-Helfer': 'water',
  'Naehrstoff-Expertin': 'measure',
  'Mineral-Meister': 'spray',
  'Elementar-Alchemistin': 'measure',
  'Lampen-Wart': 'inspect',
  'Photon-Techniker': 'inspect',
  'Lumen-Meisterin': 'thumbsup',
  'Spektral-Genie': 'amazed',
  'Qualitaets-Pruefer': 'inspect',
  'Qualitaets-Experte': 'measure',
  'Trichom-Inspektorin': 'inspect',
  'Connoisseur': 'amazed',
  'Schaedlings-Jaeger': 'spray',
  'Bio-Schuetzer': 'spray',
  'Marienkaefer-Reiterin': 'inspect',
  'Bio-Festungs-Meister': 'thumbsup',
};

/** Feste Chill-Aktion pro Zwerg (wenn nicht aktiv) */
const ROLLE_CHILL_MAP: Record<string, string> = {
  'Giesser': 'smoke',
  'Reservoir-Wart': 'chill',
  'Substrat-Mischer': 'roll_joint',
  'Topf-Traeger': 'smoke',
  'Wurzel-Pfleger': 'chill',
  'Pumpen-Techniker': 'roll_joint',
  'Leitungs-Pruefer': 'smoke',
  'Giess-Assistentin': 'chill',
  'Erde-Schaufler': 'smoke',
  'Bewaesserungs-Helfer': 'roll_joint',
  'Airstone-Wart': 'chill',
  'Anfaenger-Zwerg': 'smoke',
  'pH-Meister': 'roll_joint',
  'EC-Kontrolleur': 'chill',
  'CalMag-Spezialist': 'smoke',
  'Licht-Waechter': 'chill',
  'Bluete-Gaertnerin': 'roll_joint',
  'Veg-Spezialist': 'smoke',
  'Mix-Meister': 'roll_joint',
  'Protokollant': 'chill',
  'Schicht-Planer': 'smoke',
  'Ernte-Meister': 'smoke',
  'Trichom-Inspektor': 'roll_joint',
  'Naehrstoff-Alchemist': 'smoke',
  'Trocknungs-Expertin': 'chill',
  'Sorten-Experte': 'roll_joint',
  'Nacht-Waechter': 'smoke',
  'Garten-Patriarch': 'chill',
  'Herrscherin der Ruhe': 'smoke',
  'Der Erleuchtete': 'roll_joint',
  // Neue Rollen-Zwerge
  'Allround-Helfer': 'smoke',
  'Gaertner-Geselle': 'chill',
  'Pflanzenfluester': 'roll_joint',
  'Meistergaertner': 'smoke',
  'Nebel-Techniker': 'chill',
  'Dampf-Kontrolleur': 'smoke',
  'Klima-Expertin': 'roll_joint',
  'VPD-Virtuose': 'chill',
  'Duenger-Helfer': 'smoke',
  'Naehrstoff-Expertin': 'chill',
  'Mineral-Meister': 'roll_joint',
  'Elementar-Alchemistin': 'smoke',
  'Lampen-Wart': 'chill',
  'Photon-Techniker': 'smoke',
  'Lumen-Meisterin': 'roll_joint',
  'Spektral-Genie': 'smoke',
  'Qualitaets-Pruefer': 'chill',
  'Qualitaets-Experte': 'smoke',
  'Trichom-Inspektorin': 'roll_joint',
  'Connoisseur': 'smoke',
  'Schaedlings-Jaeger': 'chill',
  'Bio-Schuetzer': 'smoke',
  'Marienkaefer-Reiterin': 'chill',
  'Bio-Festungs-Meister': 'roll_joint',
};

export function getZwergWorkAction(id: number): string {
  const def = getZwerg(id);
  if (!def) return 'water';
  return ROLLE_ACTION_MAP[def.rolle] || 'water';
}

export function getZwergChillAction(id: number): string {
  const def = getZwerg(id);
  if (!def) return 'chill';
  return ROLLE_CHILL_MAP[def.rolle] || 'chill';
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function rollRarity(guaranteed?: Rarity | null): Rarity {
  if (guaranteed) return guaranteed;
  const total = DROP_WEIGHTS.common + DROP_WEIGHTS.rare + DROP_WEIGHTS.epic + DROP_WEIGHTS.legendary;
  let roll = Math.random() * total;
  for (const [rarity, weight] of Object.entries(DROP_WEIGHTS) as [Rarity, number][]) {
    roll -= weight;
    if (roll <= 0) return rarity;
  }
  return 'common';
}

function rollZwerg(rarity: Rarity): number {
  const pool = ZWERG_DEFS.filter(z => z.rarity === rarity);
  return pool[Math.floor(Math.random() * pool.length)].id;
}

// ─── DEFAULT STATE ──────────────────────────────────────────────────────

const DEFAULTS: GamificationState = {
  seeds: 0,
  owned: [],
  active_ids: [],
  last_daily_claim: '',
  last_login_date: '',
  login_streak: 0,
  total_logs: 0,
  total_mixes: 0,
  total_packs_opened: 0,
  known_strains: [],
  last_pack_result: null,
  v2_migrated: false,
};

// ─── STORE ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'athena_gamification';

function loadState(): GamificationState {
  if (typeof localStorage === 'undefined') return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

function persist(state: GamificationState): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}

function createZwergeStore() {
  const { subscribe, set, update } = writable<GamificationState>(loadState());

  function doUpdate(fn: (s: GamificationState) => GamificationState): void {
    update(current => {
      const next = fn(current);
      persist(next);
      return next;
    });
  }

  return {
    subscribe,

    /** Seeds verdienen (mit Buff-Berechnung) */
    earnSeeds(base: number, triggers: BuffTrigger[]) {
      doUpdate(s => {
        let bonus = 0;
        let multiplier = 1;

        // Buffs von aktiven Zwergen berechnen
        for (const aid of s.active_ids) {
          const def = getZwerg(aid);
          if (!def) continue;
          // Nur wenn der Zwerg auch besessen wird
          if (!s.owned.some(o => o.id === aid)) continue;

          if (def.buff_mode === 'multiply' && def.buff_trigger === 'passive') {
            multiplier *= def.buff_value;
          } else if (def.buff_mode === 'add' && triggers.includes(def.buff_trigger)) {
            bonus += def.buff_value;
          }
        }

        const total = Math.floor((base + bonus) * multiplier);
        if (total > 0) toastStore.show(total);
        return { ...s, seeds: s.seeds + total };
      });
    },

    /** Täglichen Login prüfen + Streak updaten */
    checkDailyLogin() {
      doUpdate(s => {
        const t = today();
        if (s.last_login_date === t) return s;

        // Streak berechnen
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().slice(0, 10);
        const streak = s.last_login_date === yesterdayStr ? s.login_streak + 1 : 1;

        return { ...s, last_login_date: t, login_streak: streak };
      });
    },

    /** Tägliches Gratis-Pack verfügbar? */
    canClaimDaily(state: GamificationState): boolean {
      return state.last_daily_claim !== today();
    },

    /** Pack öffnen → gibt Array von gewonnenen Zwerg-IDs zurück.
     *  paidExternally=true wenn Kosten bereits extern (Buds) bezahlt wurden. */
    openPack(tier: PackTier, paidExternally: boolean = false): number[] {
      let result: number[] = [];

      update(s => {
        const packDef = PACK_DEFS.find(p => p.tier === tier);
        if (!packDef) return s;

        // Kosten prüfen
        let cost = packDef.cost;

        // Sativa-Schamane Discount
        if (cost > 0) {
          for (const aid of s.active_ids) {
            const def = getZwerg(aid);
            if (def?.buff_mode === 'pack_discount' && s.owned.some(o => o.id === aid)) {
              cost = Math.floor(cost * def.buff_value);
            }
          }
        }

        if (tier === 'daily') {
          if (s.last_daily_claim === today()) return s;
        } else if (!paidExternally && s.seeds < cost) {
          return s;
        }

        // Kartenanzahl (Königin Indica Buff)
        let cardCount = packDef.card_count;
        for (const aid of s.active_ids) {
          const def = getZwerg(aid);
          if (def?.buff_mode === 'pack_cards' && s.owned.some(o => o.id === aid)) {
            cardCount += def.buff_value;
          }
        }

        // Karten rollen
        const cards: number[] = [];
        // Erste Karte: garantierte Seltenheit (falls vorhanden)
        if (packDef.guaranteed_rarity) {
          const rarity = packDef.guaranteed_rarity;
          cards.push(rollZwerg(rarity));
        }
        // Rest: zufällig
        while (cards.length < cardCount) {
          const rarity = rollRarity();
          cards.push(rollZwerg(rarity));
        }

        // Karten ins Inventar + Duplikat-Handling + Leveling
        let seedsBack = 0;
        const newOwned = [...s.owned];
        for (const cardId of cards) {
          const existing = newOwned.find(o => o.id === cardId);
          if (existing) {
            existing.count++;
            // Level-Up pruefen: 10 Karten pro Level
            const neededForNext = cardsForLevel(existing.level);
            if (existing.count >= neededForNext && existing.level < MAX_ZWERG_LEVEL) {
              existing.level++;
              toastStore.show(0, `${getZwerg(cardId)?.name} Level ${existing.level}!`);
            }
            // Duplikat-Seeds ab dem 2. Duplikat
            if (existing.count > 1) {
              const def = getZwerg(cardId);
              if (def) seedsBack += KOMPOST_VALUES[def.rarity];
            }
          } else {
            newOwned.push({ id: cardId, count: 1, obtained_at: today(), level: 1 });
          }
        }

        result = cards;

        const next: GamificationState = {
          ...s,
          seeds: tier === 'daily' ? s.seeds + seedsBack : paidExternally ? s.seeds + seedsBack : s.seeds - cost + seedsBack,
          owned: newOwned,
          total_packs_opened: s.total_packs_opened + 1,
          last_pack_result: cards,
          last_daily_claim: tier === 'daily' ? today() : s.last_daily_claim,
        };
        persist(next);
        return next;
      });

      return result;
    },

    /** Aktive Zwerge setzen (max 6 — Raum-Zwerge) */
    setActive(ids: number[]) {
      doUpdate(s => ({ ...s, active_ids: ids.slice(0, 6) }));
    },

    /** Aktiven Zwerg togglen */
    toggleActive(id: number) {
      doUpdate(s => {
        const isActive = s.active_ids.includes(id);
        if (isActive) {
          return { ...s, active_ids: s.active_ids.filter(a => a !== id) };
        }
        if (s.active_ids.length >= 6) return s;
        return { ...s, active_ids: [...s.active_ids, id] };
      });
    },

    /** Log-Eintrag tracken */
    trackLog(strain: string) {
      doUpdate(s => {
        const newStrains = s.known_strains.includes(strain) || !strain
          ? s.known_strains
          : [...s.known_strains, strain];
        return { ...s, total_logs: s.total_logs + 1, known_strains: newStrains };
      });
    },

    /** Mix tracken */
    trackMix() {
      doUpdate(s => ({ ...s, total_mixes: s.total_mixes + 1 }));
    },

    /** Pack-Kosten mit Buffs berechnen */
    getEffectiveCost(state: GamificationState, tier: PackTier): number {
      const packDef = PACK_DEFS.find(p => p.tier === tier);
      if (!packDef || packDef.cost === 0) return 0;
      let cost = packDef.cost;
      for (const aid of state.active_ids) {
        const def = getZwerg(aid);
        if (def?.buff_mode === 'pack_discount' && state.owned.some(o => o.id === aid)) {
          cost = Math.floor(cost * def.buff_value);
        }
      }
      return cost;
    },

    /**
     * State aus Sheet laden (Sheet ist Source of Truth).
     * Nimmt den höheren seeds-Wert, merged owned-Zwerge.
     */
    loadFromSheet(remote: Partial<GamificationState>) {
      doUpdate(s => {
        const mergedOwned = [...s.owned];
        for (const remoteCard of (remote.owned ?? [])) {
          const existing = mergedOwned.find(o => o.id === remoteCard.id);
          if (existing) {
            existing.count = Math.max(existing.count, remoteCard.count);
            existing.level = Math.max(existing.level || 1, (remoteCard as OwnedZwerg).level || 1);
          } else {
            mergedOwned.push({ ...remoteCard, level: (remoteCard as OwnedZwerg).level || 1 });
          }
        }
        const mergedStrains = Array.from(new Set([...s.known_strains, ...(remote.known_strains ?? [])]));
        return {
          ...s,
          seeds:              Math.max(s.seeds, remote.seeds ?? 0),
          owned:              mergedOwned,
          active_ids:         remote.active_ids ?? s.active_ids,
          login_streak:       Math.max(s.login_streak, remote.login_streak ?? 0),
          last_login_date:    remote.last_login_date ?? s.last_login_date,
          last_daily_claim:   remote.last_daily_claim ?? s.last_daily_claim,
          total_logs:         Math.max(s.total_logs, remote.total_logs ?? 0),
          total_mixes:        Math.max(s.total_mixes, remote.total_mixes ?? 0),
          total_packs_opened: Math.max(s.total_packs_opened, remote.total_packs_opened ?? 0),
          known_strains:      mergedStrains,
        };
      });
    },

    /** Starter-Pack: garantiert 1 Zwerg mit general-Rolle + bis zu 8 Karten */
    grantStarterPack() {
      doUpdate(s => {
        // Nur einmal
        if (s.owned.some(o => {
          const def = getZwerg(o.id);
          return def?.grow_role === 'general';
        })) return s;

        const newOwned = [...s.owned];
        // Garantiert Hansi (ID 31, Common General)
        const hansi = newOwned.find(o => o.id === 31);
        if (hansi) {
          hansi.count++;
        } else {
          newOwned.push({ id: 31, count: 1, obtained_at: today(), level: 1 });
        }
        // 7 weitere zufaellige Karten (schlechte Rarity)
        for (let i = 0; i < 7; i++) {
          const rarity = rollRarity();
          const cardId = rollZwerg(rarity);
          const existing = newOwned.find(o => o.id === cardId);
          if (existing) {
            existing.count++;
          } else {
            newOwned.push({ id: cardId, count: 1, obtained_at: today(), level: 1 });
          }
        }
        return { ...s, owned: newOwned };
      });
    },

    /** V2-Migration: alte Seeds → Buds konvertieren, Bonus-Pack fuer bestehende User */
    migrateToV2() {
      doUpdate(s => {
        if (s.v2_migrated) return s;
        // Bestehende User (haben schon Karten) bekommen Bonus-Pack
        const isExistingUser = s.owned.length > 0;
        const newOwned = [...s.owned];
        // Level-Feld fuer alle alten Karten sicherstellen
        for (const o of newOwned) {
          if (!o.level) o.level = 1;
        }
        if (isExistingUser) {
          // Bonus: 5 zufaellige Karten mit besserer Chance
          for (let i = 0; i < 5; i++) {
            const rarity = Math.random() < 0.3 ? 'epic' : Math.random() < 0.5 ? 'rare' : 'common';
            const cardId = rollZwerg(rarity as Rarity);
            const existing = newOwned.find(o => o.id === cardId);
            if (existing) existing.count++;
            else newOwned.push({ id: cardId, count: 1, obtained_at: today(), level: 1 });
          }
          toastStore.show(0, 'Update-Bonus: 5 Karten erhalten!');
        }
        return { ...s, owned: newOwned, v2_migrated: true, seeds: 0 };
      });
    },

    reset() {
      const fresh = { ...DEFAULTS };
      persist(fresh);
      set(fresh);
    },
  };
}

export const zwergeStore = createZwergeStore();

// ─── DERIVED STORES ─────────────────────────────────────────────────────

/** Anzahl einzigartiger gesammelter Zwerge */
export const collectionCount = derived(zwergeStore, $s => $s.owned.length);

/** Sammlung komplett? */
export const collectionComplete = derived(zwergeStore, $s => $s.owned.length >= ZWERG_DEFS.length);

/** Tägliches Pack verfügbar? */
export const dailyAvailable = derived(zwergeStore, $s => $s.last_daily_claim !== today());
