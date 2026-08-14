import axios from "axios";
import { API_URL, authHeaders } from "../api/axios";

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
