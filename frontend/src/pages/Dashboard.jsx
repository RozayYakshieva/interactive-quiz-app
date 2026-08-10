import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BarChart3, LogIn, Zap } from "lucide-react";
import Sidebar from "../components/dashboard/Sidebar";
import StatCard from "../components/dashboard/StatCard";
import QuizTable from "../components/dashboard/QuizTable";
import { dashboardService } from "../services/dashboardService";
import { quizService } from "../services/quizService";
import { clearAuth } from "../api/axios";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ quizzes: 0, sessions: 0 });
  const [myQuizzes, setMyQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleDeleteQuiz = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this quiz?"
    );
    if (!confirmed) return;

    try {
      await quizService.deleteQuiz(id);
      setMyQuizzes((prev) => prev.filter((q) => q.id !== id));
      setStats((prev) => ({
        ...prev,
        quizzes: prev.quizzes - 1,
      }));
    } catch (error) {
      console.error(error);
      alert("Failed to delete quiz.");
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("authToken");
    if (!storedUser || !token) {
      navigate("/login");
      return;
    }

    let cancelled = false;

    const loadDashboardData = async () => {
      try {
        const quizzesList = await dashboardService.getMyQuizzes();
        if (cancelled) return;

        setMyQuizzes(quizzesList);
        setStats({
          quizzes: quizzesList.length,
          sessions: 0,
        });
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load dashboard:", error);
        if (error.response?.status === 401) {
          clearAuth();
          navigate("/login");
          return;
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadDashboardData();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-gray-500 text-lg animate-pulse">
          Загрузка дашборда...
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex items-center gap-3">
            <Link
              to="/join"
              className="inline-flex items-center gap-2 border border-blue-600 text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition"
            >
              <LogIn size={18} />
              Join Quiz
            </Link>
            <Link
              to="/create-quiz"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm"
            >
              Create Quiz
            </Link>
          </div>
        </header>

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Welcome back, Organizer
          </h2>
          <p className="text-gray-500 mt-1">
            Here is an overview of your activity today.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <StatCard
            title="MY QUIZZES"
            value={stats.quizzes}
            icon={BarChart3}
            colorClass="bg-blue-100 text-blue-600"
          />
          <StatCard
            title="ACTIVE SESSIONS"
            value={stats.sessions}
            icon={Zap}
            colorClass="bg-orange-100 text-orange-600"
          />
        </div>

        <QuizTable quizzes={myQuizzes} onDelete={handleDeleteQuiz} />

        <div className="mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white flex justify-between items-center shadow-lg">
          <div>
            <h3 className="text-xl font-bold mb-2">Create New Quiz</h3>
            <p className="text-blue-100 max-w-md mb-4">
              Start building your interactive quiz now. It only takes a few
              minutes!
            </p>
            <Link
              to="/create-quiz"
              className="bg-white text-blue-600 px-6 py-2.5 rounded-lg font-bold hover:bg-blue-50 transition"
            >
              Open Creator
            </Link>
          </div>
          <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
            <span className="text-4xl text-white">+</span>
          </div>
        </div>
      </main>
    </div>
  );
}
