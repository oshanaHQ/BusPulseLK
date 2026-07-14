import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Base URL ──────────────────────────────────────────────────────────────────
// Change this to your machine's local IP when testing on a physical device.
export const API_BASE_URL = 'http://192.168.8.108:5251/api';

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
  if (res.status === 204) return {} as T;
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
  if (res.status === 204) return {} as T;
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
  if (res.status === 204) return {} as T;
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
  if (res.status === 204) return {} as T;
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
  if (res.status === 204) return {} as T;
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
  avatarId?: number;
}

export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  role: string;
  avatarId: number;
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

  async forgotPassword(email: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE_URL}/user/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to request password reset');
    }
    return res.json();
  },

  async verifyResetCode(email: string, code: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE_URL}/user/verify-reset-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Invalid or expired code');
    }
    return res.json();
  },

  async resetPassword(email: string, code: string, newPassword: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE_URL}/user/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, newPassword }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to reset password');
    }
    return res.json();
  },
};

// ── User service ──────────────────────────────────────────────────────────────

export const userService = {
  searchStaff: (role: 'Driver' | 'Conductor', search?: string) =>
    apiGet(`/user/staff?role=${role}${search ? `&search=${search}` : ''}`),

  getProfile: () =>
    apiGet<UserProfile>('/user/profile'),

  updateProfile: (data: { fullName?: string; avatarId?: number }) =>
    apiPut<UserProfile>('/user/update-profile', data),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiPut<{ message: string }>('/user/change-password', { currentPassword, newPassword }),

  getAdminStats: () => apiGet('/user/admin-stats'),
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

// ── Trip service ──────────────────────────────────────────────────────────────

export const tripService = {
  start: (timetableId: number, trackingMode: string = 'Manual', isReturnJourney: boolean = false) =>
    apiPost('/trips/start', { timetableId, trackingMode, isReturnJourney }),
  getById: (id: number) => apiGet(`/trips/${id}`),
  getActiveByBus: (busId: number) => apiGet(`/trips/active/${busId}`),
  updateProgress: (id: number, townId: number) =>
    apiPost(`/trips/${id}/progress`, { townId }),
  rollbackProgress: (id: number, townId: number) =>
    apiDelete(`/trips/${id}/progress/${townId}`),
  updateLocation: (id: number, latitude: number, longitude: number) =>
    apiPost(`/trips/${id}/location`, { latitude, longitude }),
  end: (id: number) => apiPost(`/trips/${id}/end`, {}),
};

// ── Town service ──────────────────────────────────────────────────────────────

export const townService = {
  getAll: () => apiGet('/towns'),
  getById: (id: number) => apiGet(`/towns/${id}`),
  create: (data: unknown) => apiPost('/towns', data),
  update: (id: number, data: unknown) => apiPut(`/towns/${id}`, data),
  delete: (id: number) => apiDelete(`/towns/${id}`),
};
// -- Passenger services --------------------------------------------------------

export const searchService = {
  buses: (params: any) => {
    const query = new URLSearchParams(params).toString();
    return apiGet(`/search/buses?${query}`);
  }
};

export const favoriteService = {
  getAll: () => apiGet('/favorites'),
  toggle: (busId: number) => apiPost(`/favorites/toggle/${busId}`, {}),
};

// ── Route Request service ─────────────────────────────────────────────────────

export const routeRequestService = {
  getAll: (status?: string) =>
    apiGet(`/routerequests${status ? `?status=${status}` : ''}`),
  getById: (id: number) => apiGet(`/routerequests/${id}`),
  create: (data: unknown) => apiPost('/routerequests', data),
  update: (id: number, data: unknown) => apiPut(`/routerequests/${id}`, data),
  approve: (id: number) => apiPost(`/routerequests/${id}/approve`, {}),
  reject: (id: number, statusReason: string) =>
    apiPost(`/routerequests/${id}/reject`, { statusReason }),
};

// ── Regular Passenger service ─────────────────────────────────────────────────

export const regularPassengerService = {
  // Worker
  getMyBus: () => apiGet('/regularpassengers/my-bus'),
  nominate: (passengerEmail: string) =>
    apiPost('/regularpassengers/nominate', { passengerEmail }),
  remove: (id: number) => apiDelete(`/regularpassengers/${id}`),
  // Admin
  getPending: (status?: string) =>
    apiGet(`/regularpassengers/pending${status ? `?status=${status}` : ''}`),
  approve: (id: number) => apiPost(`/regularpassengers/${id}/approve`, {}),
  reject: (id: number) => apiPost(`/regularpassengers/${id}/reject`, {}),
  // Passenger
  getMyStatus: () => apiGet('/regularpassengers/my-status'),
};

// ── Emergency service ─────────────────────────────────────────────────────────

export const emergencyService = {
  start: (tripId: number, topic: string, emergencyRoute: string) =>
    apiPost(`/trips/${tripId}/emergency`, { topic, emergencyRoute }),
  end: (tripId: number) => apiDelete(`/trips/${tripId}/emergency`),
};

// ── Announcement service ──────────────────────────────────────────────────────

export const announcementService = {
  getFeed: () => apiGet('/announcements/my-feed'),
  getByBus: (busId: number) => apiGet(`/announcements/bus/${busId}`),
  create: (data: { busId: number; title: string; message: string; type?: string; tripId?: number }) =>
    apiPost('/announcements', data),
  update: (id: number, data: { title?: string; message?: string }) =>
    apiPut(`/announcements/${id}`, data),
  remove: (id: number) => apiDelete(`/announcements/${id}`),
};

// ── Rating service (extended) ─────────────────────────────────────────────────

export const ratingService = {
  submit: (data: { busId: number; stars: number; comment?: string }) =>
    apiPost('/ratings', data),
  getByBus: (busId: number) => apiGet(`/ratings/bus/${busId}`),
};

// ── Issue Report service (extended) ──────────────────────────────────────────

export const reportService = {
  submit: (data: { busId: number; tripId?: number; description: string; isAnonymous?: boolean }) =>
    apiPost('/issueReports', data),
  getMyBusIssues: () => apiGet('/issueReports/my-buses'),
  updateStatus: (id: number, status: string) =>
    apiPut(`/issueReports/${id}/status`, { status }),
};
