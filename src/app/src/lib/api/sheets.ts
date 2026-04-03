/**
 * AutoPot Athena v3 - Google Sheets API Client
 * Communicates with a Google Apps Script Web App (deployed as REST API).
 *
 * GET endpoints:
 *   ?action=schema       -> Schema data
 *   ?action=profiles     -> Water profiles
 *   ?action=products     -> CalMag products
 *   ?action=log&standort=X&limit=N -> Log entries
 *
 * POST endpoint:
 *   body: JSON log entry -> Appends row to Log sheet
 *
 * IMPORTANT: The Apps Script URL must be set in the environment
 * or configured by the user on first launch.
 */

import type { CalMagTyp } from '../calc/schema';
import type { ECEinheit } from '../calc/units';

// ─── CONFIG ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'athena_apps_script_url';
const DEFAULT_API_URL = 'https://script.google.com/macros/s/AKfycbyrkdtoAe_H1rbjr8u2EPmJVZKKZi59AcD5hDl5XqbMRqhQkL3335IUSl7FYCeV0wcR/exec';

/** Get the configured Apps Script Web App URL */
export function getApiUrl(): string | null {
  if (typeof localStorage === 'undefined') return DEFAULT_API_URL;
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_API_URL;
}

/** Set the Apps Script Web App URL */
export function setApiUrl(url: string): void {
  localStorage.setItem(STORAGE_KEY, url.trim());
}

/** Check if API is configured */
export function isApiConfigured(): boolean {
  const url = getApiUrl();
  return url !== null && url.length > 0;
}

// ─── TYPES ────────────────────────────────────────────────────────────────

export interface LogEntry {
  /** Google Email als User-Identifier */
  user_id?: string;
  datum: string;           // ISO date
  wasserprofil: string;
  phase: string;
  woche: number;
  tag: number;
  strain: string;
  reservoir_L: number;
  faktor_pct: number;
  hahn_pct: number;
  ec_soll: number;
  ec_ist_roh: number;
  ec_ist_korr: number;
  ph_ist_roh: number;
  ph_ist_korr: number;
  ca_ziel: number;
  mg_ziel: number;
  ca_ist_a: number;
  mg_ist_a: number;
  ca_ist_b: number;
  mg_ist_b: number;
  camg_ratio: number;
  grow_g: number;
  bloom_g: number;
  core_g: number;
  fade_mL: number;
  cleanse_mL: number;
  calmag_mLpL: number;
  calmag_mL_total: number;
  mono_mL: number;
  calmag_typ: CalMagTyp;
  ec_einheit: ECEinheit;
  run_id: string;
  notiz: string;
  feedline?: string;
  /** Generische Dosierungen als JSON (fuer nicht-Athena Lines) */
  dosierungen_json?: string;
}

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

// ─── API CALLS ────────────────────────────────────────────────────────────

async function apiGet<T>(action: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
  const url = getApiUrl();
  if (!url) return { ok: false, error: 'API URL nicht konfiguriert' };

  const searchParams = new URLSearchParams({ action, ...params });
  try {
    const res = await fetch(`${url}?${searchParams.toString()}`, {
      method: 'GET',
      redirect: 'follow',
    });
    const data = await res.json();
    if (data.error) return { ok: false, error: data.error };
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: `Netzwerkfehler: ${e instanceof Error ? e.message : String(e)}` };
  }
}

async function apiPost<T>(body: unknown): Promise<ApiResponse<T>> {
  const url = getApiUrl();
  if (!url) return { ok: false, error: 'API URL nicht konfiguriert' };

  try {
    const res = await fetch(url, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.error) return { ok: false, error: data.error };
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: `Netzwerkfehler: ${e instanceof Error ? e.message : String(e)}` };
  }
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────

/** Fetch schema data from Google Sheet */
export async function fetchSchema(): Promise<ApiResponse<unknown>> {
  return apiGet('schema');
}

/** Fetch water profiles */
export async function fetchProfiles(): Promise<ApiResponse<unknown>> {
  return apiGet('profiles');
}

/** Fetch product data */
export async function fetchProducts(): Promise<ApiResponse<unknown>> {
  return apiGet('products');
}

/** Fetch log entries */
export async function fetchLog(standort?: string, limit?: number): Promise<ApiResponse<LogEntry[]>> {
  const params: Record<string, string> = {};
  if (standort) params.standort = standort;
  if (limit) params.limit = String(limit);
  return apiGet<LogEntry[]>('log', params);
}

/** Post a new log entry to the Google Sheet */
export async function postLogEntry(entry: LogEntry): Promise<ApiResponse<{ row: number }>> {
  return apiPost<{ row: number }>({ action: 'log', ...entry });
}

// ─── USER API ─────────────────────────────────────────────────────────────

export interface UserRecord {
  email: string;
  name: string;
  role: 'owner' | 'grower' | 'viewer';
  created_at: string;
  last_login: string;
}

/** Nutzer aus Sheet abrufen */
export async function fetchUser(email: string): Promise<ApiResponse<UserRecord>> {
  return apiGet<UserRecord>('user', { email });
}

/**
 * Nutzer anlegen oder last_login updaten.
 * Gibt die im Sheet hinterlegte Rolle zurück.
 * Rolle wird nur beim ersten Anlegen gesetzt (viewer) — danach im Sheet ändern.
 */
export async function upsertUser(data: { email: string; name: string }): Promise<ApiResponse<{ ok: boolean; role: string }>> {
  return apiPost<{ ok: boolean; role: string }>({ action: 'upsert_user', ...data });
}

// ─── GAMIFICATION API ─────────────────────────────────────────────────────

export interface GamificationRecord {
  user_email: string;
  seeds: number;
  owned: { id: number; count: number; obtained_at: string }[];
  active_ids: number[];
  login_streak: number;
  last_login_date: string;
  last_daily_claim: string;
  total_logs: number;
  total_mixes: number;
  total_packs_opened: number;
  known_strains: string[];
  updated_at: string;
}

/** Gamification-State aus Sheet laden */
export async function fetchGamification(email: string): Promise<ApiResponse<GamificationRecord>> {
  return apiGet<GamificationRecord>('gamification', { email });
}

/** Gamification-State ins Sheet speichern */
export async function saveGamification(data: GamificationRecord): Promise<ApiResponse<{ ok: boolean }>> {
  return apiPost<{ ok: boolean }>({ action: 'gamification', ...data });
}

