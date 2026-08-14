import axios from "axios";
import { API_URL, authHeaders, getAuthToken } from "../api/axios";

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const sessionService = {
  async startSession(quizId) {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Not authenticated. Please log in again.");
    }

    const response = await apiClient.post(
      `/api/quizzes/${quizId}/start`,
      {},
      { headers: authHeaders() }
    );
    return response.data;
  },

  async getSessionByCode(code) {
    const response = await apiClient.get(`/api/sessions/code/${code}`, {
      headers: authHeaders(),
    });
    return response.data;
  },

  async cancelSession(code) {
    await apiClient.delete(`/api/sessions/code/${code}`, {
      headers: authHeaders(),
    });
  },

  async getCurrentQuestion(sessionId) {
    const response = await apiClient.get(
      `/api/sessions/${sessionId}/current-question`, { 
        headers: authHeaders(), 
      });
    return response.data;
  },

  async joinSession(data) {
    const response = await apiClient.post("/api/sessions/join", data);
    return response.data;
  },

  async getParticipants(sessionId) {
    const response = await apiClient.get(
      `/api/sessions/${sessionId}/participants`,
      { headers: authHeaders() }
    );
    return response.data;
  },

  async startGame(sessionId) {
    const response = await apiClient.post(
      `/api/sessions/${sessionId}/start`,
      {},
      { headers: authHeaders() }
    );
    return response.data;
  },

  async submitAnswer(sessionId, payload) {
    const participantId = localStorage.getItem(`participant_${sessionId}`);
    const body = {
      ...payload,
      participantId: participantId ? Number(participantId) : undefined,
    };
    const response = await apiClient.post(
      `/api/sessions/${sessionId}/answer`,
      body
    );
    return response.data;
  },

  async getAnswerProgress(sessionId) {
    const response = await apiClient.get(
      `/api/sessions/${sessionId}/answer-progress`
    );
    return response.data;
  },

  async nextQuestion(sessionId) {
    const response = await apiClient.post(
      `/api/sessions/${sessionId}/next-question`,
      {},
      { headers: authHeaders() }
    );
    return response.data;
  },

  async getLeaderboard(sessionId) {
    const response = await apiClient.get(
      `/api/sessions/${sessionId}/leaderboard`
    );
    return response.data;
  },

  async finishGame(sessionId) {
    const response = await apiClient.post(
      `/api/sessions/${sessionId}/finish`,
      {},
      { headers: authHeaders() }
    );
    return response.data;
  },

  async getHistory() {
    const response = await apiClient.get("/api/sessions/history", {
      headers: authHeaders(),
    });
    return response.data;
  },
};
