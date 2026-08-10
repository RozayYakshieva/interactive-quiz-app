import api from "../api/axios";

export const dashboardService = {
  getMyQuizzes: async () => {
    const response = await api.get("/quizzes");
    return response.data;
  },
};
