/**
 * Auth store — Google Identity Services Login
 * Persistiert in localStorage, kein Backend nötig
 */
import { writable, derived } from 'svelte/store';

export interface AuthUser {
  /** Google Email */
  email: string;
  /** Anzeigename */
  name: string;
  /** Profilbild-URL */
  picture: string;
  /** Rolle: owner darf alles, grower eigene Daten, viewer nur lesen */
  role: 'owner' | 'grower' | 'viewer';
  /** Google JWT credential (für Verifizierung) */
  credential: string;
  /** Login-Zeitstempel */
  logged_in_at: string;
}

const STORAGE_KEY = 'athena_auth';
const CLIENT_ID_KEY = 'athena_google_client_id';

/** Fest eingebaute Client ID — kein Setup durch User nötig */
export const GOOGLE_CLIENT_ID = '72612375346-mupsp0r6imklolbtv96734bkmst8obd5.apps.googleusercontent.com';

function loadAuth(): AuthUser | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function createAuthStore() {
  const { subscribe, set } = writable<AuthUser | null>(loadAuth());

  return {
    subscribe,

    /** Login mit Google JWT Credential */
    login(credential: string) {
      const payload = decodeJwt(credential);
      if (!payload?.email) return;

      const user: AuthUser = {
        email: payload.email,
        name: payload.name ?? payload.email.split('@')[0],
        picture: payload.picture ?? '',
        role: 'viewer', // Echte Rolle kommt vom Sheet (login-Seite syncRoleFromSheet)
        credential,
        logged_in_at: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      set(user);
    },

    /** Rolle ändern */
    setRole(role: AuthUser['role']) {
      const current = loadAuth();
      if (!current) return;
      current.role = role;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      set(current);
    },

    /** Logout */
    logout() {
      localStorage.removeItem(STORAGE_KEY);
      set(null);
    }
  };
}

/** JWT Payload dekodieren (ohne Verifizierung — reicht für User-Differenzierung) */
function decodeJwt(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export const authStore = createAuthStore();
export const isLoggedIn = derived(authStore, $a => $a !== null);
export const userName = derived(authStore, $a => $a?.name ?? '');
export const userEmail = derived(authStore, $a => $a?.email ?? '');

/** Google Client ID — immer die eingebaute ID zurückgeben */
export function getClientId(): string {
  return GOOGLE_CLIENT_ID;
}

export function setClientId(_id: string): void {
  // no-op: Client ID ist hardcoded
}
