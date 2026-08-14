import axios from "axios";
import { API_URL, authHeaders } from "../api/axios";

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const quizService = {
  async createQuiz(quizData) {
    const response = await apiClient.post("/api/quizzes", quizData, {
      headers: authHeaders(),
    });
    return response.data;
  },

  async getQuizzes() {
    const response = await apiClient.get("/api/quizzes", {
      headers: authHeaders(),
    });
    return response.data;
  },

  async getQuizById(id) {
    const response = await apiClient.get(`/api/quizzes/${id}`, {
      headers: authHeaders(),
    });
    return response.data;
  },

  async getQuestions(quizId) {
    const response = await apiClient.get(`/api/quizzes/${quizId}/questions`, {
      headers: authHeaders(),
    });
    return response.data;
  },

  async updateQuiz(id, quizData) {
    const response = await apiClient.put(`/api/quizzes/${id}`, quizData, {
      headers: authHeaders(),
    });
    return response.data;
  },

  async createQuestion(quizId, questionData) {
    const response = await apiClient.post(
      `/api/quizzes/${quizId}/questions`,
      questionData,
      { headers: authHeaders() }
    );
    return response.data;
  },

  async updateQuestion(quizId, questionId, questionData) {
    const response = await apiClient.put(
      `/api/quizzes/${quizId}/questions/${questionId}`,
      questionData,
      { headers: authHeaders() }
    );
    return response.data;
  },

  async deleteQuestion(quizId, questionId) {
    await apiClient.delete(`/api/quizzes/${quizId}/questions/${questionId}`, {
      headers: authHeaders(),
    });
  },

  async deleteQuiz(id) {
    await apiClient.delete(`/api/quizzes/${id}`, {
      headers: authHeaders(),
    });
  },

  async startSession(quizId) {
    const response = await apiClient.post(
      `/api/quizzes/${quizId}/start`,
      {},
      { headers: authHeaders() }
    );
    return response.data;
  },
};
