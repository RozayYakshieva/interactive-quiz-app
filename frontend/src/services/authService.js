import axios from "axios";
import { API_URL, authHeaders } from "../api/axios";

const authClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const authService = {
  login: async (email, password) => {
    try {
      const response = await authClient.post("/api/auth/login", { email, password });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  register: async (data) => {
    const response = await authClient.post("/api/auth/register", data);
    return response.data;
  },

  getProfile: async () => {
    const response = await authClient.get("/api/auth/me", { headers: authHeaders() });
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await authClient.put("/api/auth/profile", data, {
      headers: authHeaders(),
    });
    return response.data;
  },

  changePassword: async (data) => {
    await authClient.put("/api/auth/password", data, { headers: authHeaders() });
  },

  resetPassword: async (data) => {
    const response = await authClient.post("/api/auth/reset-password", data);
    return response.data;
  },
};
