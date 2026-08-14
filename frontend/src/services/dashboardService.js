import axios from "axios";
import { authHeaders } from "../api/axios";

const API_URL = import.meta.env.VITE_API_URL || "";

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const dashboardService = {
  getMyQuizzes: async () => {
    const response = await apiClient.get("/api/quizzes", { headers: authHeaders() });
    return response.data;
  },
};
