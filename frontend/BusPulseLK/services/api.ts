const API_BASE_URL = 'http://192.168.8.108:5251/api';

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

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.title || 'Login failed');
    }

    return response.json();
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    // Remove the duplicate role mapping - it's already done in register.tsx
    const response = await fetch(`${API_BASE_URL}/user/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        role: data.role, // Use the role directly - it's already mapped correctly
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.title || 'Registration failed');
    }

    return response.json();
  },
};