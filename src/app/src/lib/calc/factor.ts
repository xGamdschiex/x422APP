/**
 * AutoPot Athena v3 - Factor Calculation
 * Auto-factor interpolates linearly between Fmin and Fmax over 7 days.
 * Manual mode: user sets value directly.
 * Constraint: 20-100%
 */

import type { SchemaRow } from './schema';

export type FaktorModus = 'Auto' | 'Manuell';

export interface FaktorInput {
  modus: FaktorModus;
  manuell_pct: number;  // only used when modus='Manuell'
  tag: number;          // 1-7
  schema: SchemaRow;
}

export interface FaktorResult {
  aktiv_pct: number;
  auto_pct: number;
  modus: FaktorModus;
}

/** Calculate auto-factor: linear interpolation Fmin -> Fmax over days 1-7 */
export function calcAutoFaktor(fmin: number, fmax: number, tag: number): number {
  const clamped = Math.max(1, Math.min(7, tag));
  const raw = fmin + (fmax - fmin) * (clamped - 1) / 6;
  return round(raw, 1);
}

/** Calculate active factor based on mode */
export function calcFaktor(input: FaktorInput): FaktorResult {
  const auto_pct = calcAutoFaktor(input.schema.fmin, input.schema.fmax, input.tag);

  let aktiv_pct: number;
  if (input.modus === 'Auto') {
    aktiv_pct = auto_pct;
  } else {
    aktiv_pct = clamp(input.manuell_pct, 20, 100);
  }

  return { aktiv_pct, auto_pct, modus: input.modus };
}

/** Clamp value between min and max */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round(n: number, decimals: number): number {
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
}
