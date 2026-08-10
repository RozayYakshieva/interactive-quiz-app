import api, { authHeaders, getAuthToken } from "../api/axios";

export const sessionService = {
  async startSession(quizId) {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Not authenticated. Please log in again.");
    }

    const response = await api.post(
      "/sessions",
      { quizId: Number(quizId) },
      { headers: authHeaders() }
    );
    return response.data;
  },

  async getSessionByCode(code) {
    const response = await api.get(`/sessions/code/${code}`, {
      headers: authHeaders(),
    });
    return response.data;
  },

  async cancelSession(code) {
    await api.delete(`/sessions/code/${code}`, {
      headers: authHeaders(),
    });
  },

  async getCurrentQuestion(sessionId) {
    const response = await api.get(`/sessions/${sessionId}/current-question`);
    return response.data;
  },

  async joinSession(data) {
    const response = await api.post("/sessions/join", data);
    return response.data;
  },

  async getParticipants(sessionId) {
    const response = await api.get(`/sessions/${sessionId}/participants`, {
      headers: authHeaders(),
    });
    return response.data;
  },

  async startGame(sessionId) {
    const response = await api.post(
      `/sessions/${sessionId}/start`,
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
    const response = await api.post(`/sessions/${sessionId}/answer`, body);
    return response.data;
  },

  async getAnswerProgress(sessionId) {
    const response = await api.get(`/sessions/${sessionId}/answer-progress`);
    return response.data;
  },

  async nextQuestion(sessionId) {
    const response = await api.post(
      `/sessions/${sessionId}/next-question`,
      {},
      { headers: authHeaders() }
    );
    return response.data;
  },

  async getLeaderboard(sessionId) {
    const response = await api.get(`/sessions/${sessionId}/leaderboard`);
    return response.data;
  },

  async finishGame(sessionId) {
    const response = await api.post(
      `/sessions/${sessionId}/finish`,
      {},
      { headers: authHeaders() }
    );
    return response.data;
  },

  async getHistory() {
    const response = await api.get("/sessions/history", {
      headers: authHeaders(),
    });
    return response.data;
  },
};
