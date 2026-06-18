import api from "./api";

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export const authApi = {
  register: async (name: string, email: string, password: string) => {
    const { data } = await api.post<{ message: string; user: User }>("/auth/register", {
      name, email, password,
    });
    return data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>("/auth/login", { email, password });
    return data;
  },

  logout: async () => {
    await api.post("/auth/logout");
  },

  getMe: async (): Promise<User> => {
    const { data } = await api.get<{ user: User }>("/auth/me");
    return data.user;
  },
};
