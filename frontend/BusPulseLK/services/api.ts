import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Base URL ──────────────────────────────────────────────────────────────────
// Change this to your machine's local IP when testing on a physical device.
const API_BASE_URL = 'http://10.236.25.49:5251/api';

// ── Token helper ──────────────────────────────────────────────────────────────

const TOKEN_KEY = 'buspulse_token';

async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

// ── Fetch wrappers ────────────────────────────────────────────────────────────

/** Authenticated GET */
async function apiGet<T>(path: string): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `GET ${path} failed (${res.status})`);
  }
  return res.json();
}

/** Authenticated POST */
async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `POST ${path} failed (${res.status})`);
  }
  return res.json();
}

/** Authenticated PUT */
async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `PUT ${path} failed (${res.status})`);
  }
  return res.json();
}

/** Authenticated PATCH */
async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `PATCH ${path} failed (${res.status})`);
  }
  return res.json();
}

/** Authenticated DELETE */
async function apiDelete<T>(path: string): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `DELETE ${path} failed (${res.status})`);
  }
  return res.json();
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type UserRole = 'Admin' | 'BusOwner' | 'Driver' | 'Conductor' | 'Passenger';

export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  isRegularPassenger?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  role: 'Passenger' | 'BusOwner' | 'Driver' | 'Conductor' | 'Admin';
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    fullName: string;
    email: string;
    role: string;
    isRegularPassenger?: boolean;
  };
}

// ── Auth service (no token needed — public endpoints) ─────────────────────────

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Login failed');
    }
    return res.json();
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/user/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Registration failed');
    }
    return res.json();
  },
};

// ── Route service ─────────────────────────────────────────────────────────────

export const routeService = {
  getAll: () => apiGet('/routes'),
  getById: (id: number) => apiGet(`/routes/${id}`),
  getStops: (id: number) => apiGet(`/routes/${id}/stops`),
  getBuses: (id: number) => apiGet(`/routes/${id}/buses`),
  create: (data: unknown) => apiPost('/routes', data),
  update: (id: number, data: unknown) => apiPut(`/routes/${id}`, data),
  delete: (id: number) => apiDelete(`/routes/${id}`),
};

// ── Bus service ───────────────────────────────────────────────────────────────

export const busService = {
  getAll: () => apiGet('/buses'),
  getMine: () => apiGet('/buses/mine'),
  getPending: () => apiGet('/buses/pending'),
  getById: (id: number) => apiGet(`/buses/${id}`),
  getRoutes: (id: number) => apiGet(`/buses/${id}/routes`),
  getAvailableDrivers: () => apiGet('/buses/staff/available-drivers'),
  getAvailableConductors: () => apiGet('/buses/staff/available-conductors'),
  create: (data: unknown) => apiPost('/buses', data),
  update: (id: number, data: unknown) => apiPut(`/buses/${id}`, data),
  delete: (id: number) => apiDelete(`/buses/${id}`),
  approve: (id: number) => apiPatch(`/buses/${id}/approve`),
  assignDriver: (id: number, userId: number) => apiPatch(`/buses/${id}/assign-driver`, { userId }),
  unassignDriver: (id: number) => apiPatch(`/buses/${id}/unassign-driver`),
  assignConductor: (id: number, userId: number) => apiPatch(`/buses/${id}/assign-conductor`, { userId }),
  unassignConductor: (id: number) => apiPatch(`/buses/${id}/unassign-conductor`),
};

// ── Timetable service ─────────────────────────────────────────────────────────

export const timetableService = {
  getAll: () => apiGet('/timetables'),
  getById: (id: number) => apiGet(`/timetables/${id}`),
  create: (data: unknown) => apiPost('/timetables', data),
  update: (id: number, data: unknown) => apiPut(`/timetables/${id}`, data),
  delete: (id: number) => apiDelete(`/timetables/${id}`),
};

// ── Town service ──────────────────────────────────────────────────────────────

export const townService = {
  getAll: () => apiGet('/towns'),
  getById: (id: number) => apiGet(`/towns/${id}`),
  create: (data: unknown) => apiPost('/towns', data),
  update: (id: number, data: unknown) => apiPut(`/towns/${id}`, data),
  delete: (id: number) => apiDelete(`/towns/${id}`),
};