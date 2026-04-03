/**
 * Equipment & Extraction Definitionen
 * Grow-Spaces, Equipment-Tiers, Extraction-Methoden
 */

// ─── GROW SPACES ──────────────────────────────────────────────────────

export type SpaceType = 'fensterbank' | 'kleine_box' | 'grosse_box' | 'kleiner_raum';
export type ZwergRole = 'general' | 'vpd_manager' | 'nutrient_manager' | 'light_manager' | 'quality_manager' | 'pest_controller';

export interface SpaceDef {
  type: SpaceType;
  label: string;
  max_plants: number;
  required_roles: ZwergRole[];
  cost_buds: number;
  /** Voraussetzung: vorheriger Space-Typ muss existieren */
  requires: SpaceType | null;
}

export const SPACE_DEFS: SpaceDef[] = [
  {
    type: 'fensterbank',
    label: 'Fensterbank',
    max_plants: 3,
    required_roles: ['general'],
    cost_buds: 0,
    requires: null,
  },
  {
    type: 'kleine_box',
    label: 'Kleine Growbox',
    max_plants: 3,
    required_roles: ['vpd_manager', 'nutrient_manager', 'light_manager'],
    cost_buds: 150,
    requires: 'fensterbank',
  },
  {
    type: 'grosse_box',
    label: 'Grosse Growbox',
    max_plants: 5,
    required_roles: ['vpd_manager', 'nutrient_manager', 'light_manager', 'quality_manager'],
    cost_buds: 600,
    requires: 'kleine_box',
  },
  {
    type: 'kleiner_raum',
    label: 'Kleiner Grow-Raum',
    max_plants: 9,
    required_roles: ['vpd_manager', 'nutrient_manager', 'light_manager', 'quality_manager', 'pest_controller'],
    cost_buds: 2500,
    requires: 'grosse_box',
  },
];

export function getSpaceDef(type: SpaceType): SpaceDef {
  return SPACE_DEFS.find(s => s.type === type)!;
}

export const ROLE_LABELS: Record<ZwergRole, string> = {
  general: 'Allrounder',
  vpd_manager: 'VPD Manager',
  nutrient_manager: 'Naehrstoff Manager',
  light_manager: 'Licht Manager',
  quality_manager: 'Qualitaets Manager',
  pest_controller: 'Schaedlings Kontroller',
};

// ─── EQUIPMENT ────────────────────────────────────────────────────────

export type EquipCategory = 'light' | 'venti' | 'abluft' | 'entfeuchter';

export interface EquipDef {
  id: string;
  name: string;
  category: EquipCategory;
  tier: number;
  cost_buds: number;
  /** Ertrag-Bonus als Multiplikator (1.0 = kein Bonus) */
  yield_mult: number;
  /** Speed-Bonus (reduziert Grow-Zeit) */
  speed_mult: number;
  /** Bruchwahrscheinlichkeit pro Grow (0-1) */
  break_chance: number;
  /** Reparaturkosten in Buds */
  repair_cost: number;
  /** Ab welchem Space-Typ verfuegbar */
  min_space: SpaceType;
}

export const EQUIP_DEFS: EquipDef[] = [
  // ── FENSTERBANK LIGHT ──
  { id: 'light-cfl',        name: 'CFL Sparlampe',          category: 'light', tier: 1, cost_buds: 10,   yield_mult: 1.05, speed_mult: 1.0,  break_chance: 0.005, repair_cost: 5,   min_space: 'fensterbank' },
  { id: 'light-led-lila',   name: 'LED Lila',               category: 'light', tier: 2, cost_buds: 35,   yield_mult: 1.15, speed_mult: 1.05, break_chance: 0.003, repair_cost: 15,  min_space: 'fensterbank' },

  // ── BOX LIGHT ──
  { id: 'light-led-panel',  name: 'LED Panel',              category: 'light', tier: 3, cost_buds: 120,  yield_mult: 1.25, speed_mult: 1.08, break_chance: 0.002, repair_cost: 40,  min_space: 'kleine_box' },
  { id: 'light-qb',         name: 'Quantum Board',          category: 'light', tier: 4, cost_buds: 350,  yield_mult: 1.40, speed_mult: 1.12, break_chance: 0.001, repair_cost: 80,  min_space: 'grosse_box' },
  { id: 'light-pro',        name: 'Full Spectrum Pro',       category: 'light', tier: 5, cost_buds: 900,  yield_mult: 1.60, speed_mult: 1.15, break_chance: 0.001, repair_cost: 150, min_space: 'kleiner_raum' },

  // ── VENTI ──
  { id: 'venti-clip',       name: 'Clip Fan',               category: 'venti', tier: 1, cost_buds: 8,    yield_mult: 1.03, speed_mult: 1.0,  break_chance: 0.12, repair_cost: 3,   min_space: 'fensterbank' },
  { id: 'venti-stand',      name: 'Standventilator',        category: 'venti', tier: 2, cost_buds: 25,   yield_mult: 1.06, speed_mult: 1.0,  break_chance: 0.08, repair_cost: 10,  min_space: 'kleine_box' },
  { id: 'venti-oscillate',  name: 'Oszillierender Fan',     category: 'venti', tier: 3, cost_buds: 80,   yield_mult: 1.10, speed_mult: 1.0,  break_chance: 0.05, repair_cost: 25,  min_space: 'grosse_box' },

  // ── ABLUFT ──
  { id: 'abluft-inline',    name: 'Inline Luefter',         category: 'abluft', tier: 1, cost_buds: 45,  yield_mult: 1.08, speed_mult: 1.0,  break_chance: 0.08, repair_cost: 15,  min_space: 'kleine_box' },
  { id: 'abluft-carbon',    name: 'AKF Kombi',              category: 'abluft', tier: 2, cost_buds: 120, yield_mult: 1.15, speed_mult: 1.03, break_chance: 0.06, repair_cost: 35,  min_space: 'grosse_box' },
  { id: 'abluft-ec',        name: 'EC Controller Abluft',   category: 'abluft', tier: 3, cost_buds: 300, yield_mult: 1.22, speed_mult: 1.05, break_chance: 0.04, repair_cost: 60,  min_space: 'kleiner_raum' },

  // ── ENTFEUCHTER ──
  { id: 'entf-mini',        name: 'Mini Entfeuchter',       category: 'entfeuchter', tier: 1, cost_buds: 60,  yield_mult: 1.05, speed_mult: 1.0, break_chance: 0.03, repair_cost: 20,  min_space: 'grosse_box' },
  { id: 'entf-pro',         name: 'Profi Entfeuchter',      category: 'entfeuchter', tier: 2, cost_buds: 200, yield_mult: 1.12, speed_mult: 1.0, break_chance: 0.02, repair_cost: 50,  min_space: 'kleiner_raum' },
];

export function getEquip(id: string): EquipDef | undefined {
  return EQUIP_DEFS.find(e => e.id === id);
}

export function getEquipByCategory(cat: EquipCategory): EquipDef[] {
  return EQUIP_DEFS.filter(e => e.category === cat);
}

export function getEquipForSpace(spaceType: SpaceType): EquipDef[] {
  const spaceOrder: SpaceType[] = ['fensterbank', 'kleine_box', 'grosse_box', 'kleiner_raum'];
  const idx = spaceOrder.indexOf(spaceType);
  return EQUIP_DEFS.filter(e => spaceOrder.indexOf(e.min_space) <= idx);
}

// ─── EXTRACTION ───────────────────────────────────────────────────────

export interface ExtractionDef {
  id: string;
  name: string;
  /** Equipment-Kosten in Buds */
  cost_buds: number;
  /** Buds-Input pro Run */
  input_buds: number;
  /** Wax-Output pro Run (in g) */
  output_wax_g: number;
  /** Ueberspringt Curing-Phase? (Live-Varianten) */
  skip_curing: boolean;
  /** Voraussetzung: andere Extraction muss besessen werden */
  requires: string | null;
  tier: number;
  description: string;
}

export const EXTRACTION_DEFS: ExtractionDef[] = [
  { id: 'ext-drysift',     name: 'Dry Sift (Siebe)',              cost_buds: 30,   input_buds: 20, output_wax_g: 0.15, skip_curing: false, requires: null,            tier: 1, description: 'Kief durch Sieben — guenstig, einfach' },
  { id: 'ext-bubble-bags', name: 'Bubble Hash (Ice Bags)',        cost_buds: 80,   input_buds: 25, output_wax_g: 0.22, skip_curing: false, requires: null,            tier: 2, description: 'Eis-Wasser Extraktion mit Beuteln' },
  { id: 'ext-bubble-wash', name: 'Bubble Hash (Waschmaschine)',   cost_buds: 250,  input_buds: 30, output_wax_g: 0.35, skip_curing: false, requires: 'ext-bubble-bags', tier: 3, description: 'Automatisierte Eis-Wasser Extraktion' },
  { id: 'ext-rosin-hair',  name: 'Rosin (Glaetteisen)',          cost_buds: 15,   input_buds: 15, output_wax_g: 0.08, skip_curing: false, requires: null,            tier: 2, description: 'Ghetto-Tech Rosin — billig aber wenig Ertrag' },
  { id: 'ext-rosin-press', name: 'Rosin Press (Hydraulisch)',     cost_buds: 500,  input_buds: 20, output_wax_g: 0.30, skip_curing: false, requires: 'ext-rosin-hair', tier: 4, description: 'Profi Rosin-Presse, loeungsmittelfrei' },
  { id: 'ext-bho',         name: 'BHO (Closed Loop)',             cost_buds: 1200, input_buds: 25, output_wax_g: 0.45, skip_curing: false, requires: null,            tier: 5, description: 'Butan-Extraktion im geschlossenen System' },
  { id: 'ext-live-rosin',  name: 'Live Rosin (Freeze Dry)',       cost_buds: 2000, input_buds: 25, output_wax_g: 0.40, skip_curing: true,  requires: 'ext-rosin-press', tier: 6, description: 'Frische Blueten → Freeze Dryer → Presse' },
  { id: 'ext-live-bho',    name: 'Live Resin (Cryo BHO)',         cost_buds: 2500, input_buds: 25, output_wax_g: 0.50, skip_curing: true,  requires: 'ext-bho',       tier: 7, description: 'Frische Blueten → Cryo → CLS' },
  { id: 'ext-fullmelt',    name: '6-Star Full Melt',              cost_buds: 3500, input_buds: 35, output_wax_g: 0.55, skip_curing: true,  requires: 'ext-live-rosin', tier: 8, description: 'Waschmaschine + Freeze Dryer + Presse = Perfektion' },
];

export function getExtraction(id: string): ExtractionDef | undefined {
  return EXTRACTION_DEFS.find(e => e.id === id);
}
