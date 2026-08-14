import axios from "axios";
import api, { authHeaders } from "../api/axios";

const API_URL = import.meta.env.VITE_API_URL || "";

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
    const response = await api.get("/quizzes");
    return response.data;
  },

  async getQuizById(id) {
    const response = await api.get(`/quizzes/${id}`);
    return response.data;
  },

  async getQuestions(quizId) {
    const response = await api.get(`/quizzes/${quizId}/questions`);
    return response.data;
  },

  async updateQuiz(id, quizData) {
    const response = await api.put(`/quizzes/${id}`, quizData);
    return response.data;
  },

  async createQuestion(quizId, questionData) {
    const response = await api.post(`/quizzes/${quizId}/questions`, questionData);
    return response.data;
  },

  async updateQuestion(quizId, questionId, questionData) {
    const response = await api.put(
      `/quizzes/${quizId}/questions/${questionId}`,
      questionData
    );
    return response.data;
  },

  async deleteQuestion(quizId, questionId) {
    await api.delete(`/quizzes/${quizId}/questions/${questionId}`);
  },

  async deleteQuiz(id) {
    await api.delete(`/quizzes/${id}`);
  },
};
