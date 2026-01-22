const API_BASE_URL = 'http://10.230.19.49:5251/api';

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
    // Map frontend role values to backend values
    const roleMap: { [key: string]: string } = {
      'Passenger': 'Passenger',
      'Bus Owner': 'BusOwner',
      'Conductor/Driver': 'Driver',
    };

    const response = await fetch(`${API_BASE_URL}/user/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        role: roleMap[data.role as any] || 'Passenger',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.title || 'Registration failed');
    }

    return response.json();
  },
};
