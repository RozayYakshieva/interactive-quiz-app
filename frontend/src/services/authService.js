import api, { authHeaders } from "../api/axios";

export const authService = {
  login: async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  register: async (data) => {
    const response = await api.post("/auth/register", data);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get("/auth/me", { headers: authHeaders() });
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put("/auth/profile", data, {
      headers: authHeaders(),
    });
    return response.data;
  },

  changePassword: async (data) => {
    await api.put("/auth/password", data, { headers: authHeaders() });
  },

  resetPassword: async (data) => {
    const response = await api.post("/auth/reset-password", data);
    return response.data;
  },
};
