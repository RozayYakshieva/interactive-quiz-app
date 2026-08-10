import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  History as HistoryIcon,
  Trophy,
  Users,
  CalendarDays,
  Eye,
} from "lucide-react";
import Sidebar from "../components/dashboard/Sidebar";
import { sessionService } from "../services/sessionService";
import { clearAuth } from "../api/axios";

export default function History() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("user");

    if (!token && !storedUser) {
      navigate("/login");
      return;
    }

    let cancelled = false;

    const loadHistory = async () => {
      try {
        const data = await sessionService.getHistory();
        if (cancelled) return;
        setSessions(Array.isArray(data) ? data : []);
      } catch (error) {
        if (cancelled) return;
        if (error.response?.status === 401) {
          clearAuth();
          navigate("/login");
          return;
        }
        setSessions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return "—";

    return parsedDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getPlayersCount = (session) => {
    if (typeof session.playersCount === "number") return session.playersCount;
    if (typeof session.participantsCount === "number") return session.participantsCount;
    if (Array.isArray(session.participants)) return session.participants.length;
    return 0;
  };

  const getQuizTitle = (session) =>
    session.quizTitle || session.quiz?.title || session.title || "Untitled Quiz";

  const getSessionId = (session) => session.id || session.sessionId;

  const getStatusLabel = (status) => {
    if (!status) return "Finished";
    return status.charAt(0) + status.slice(1).toLowerCase();
  };

  const handleViewResults = (session) => {
    const sessionId = getSessionId(session);
    if (!sessionId) return;
    navigate(`/leaderboard/${sessionId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-gray-500 text-lg animate-pulse">Loading history...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <header className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <HistoryIcon size={23} />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">History</h1>
            </div>
            <p className="text-gray-500">
              View your previously hosted quiz sessions and results.
            </p>
          </header>

          {sessions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-14 text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <HistoryIcon size={34} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mt-6">No quiz history yet</h2>
              <p className="text-gray-500 max-w-md mx-auto mt-2">
                Once you finish hosting a quiz, your completed sessions will appear here.
              </p>
              <button
                onClick={() => navigate("/dashboard")}
                className="mt-7 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
              >
                Go to My Quizzes
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="font-bold text-gray-900">Completed Sessions</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {sessions.length} {sessions.length === 1 ? "session" : "sessions"}
                </p>
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 text-left text-xs uppercase tracking-wider text-gray-500">
                      <th className="px-6 py-4 font-semibold">Quiz</th>
                      <th className="px-6 py-4 font-semibold">Date</th>
                      <th className="px-6 py-4 font-semibold">Players</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold text-right">Results</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sessions.map((session, index) => (
                      <tr
                        key={getSessionId(session) || index}
                        className="hover:bg-slate-50 transition"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                              <Trophy size={19} />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {getQuizTitle(session)}
                              </div>
                              {session.code && (
                                <div className="text-xs text-gray-400 mt-1">
                                  Room: {session.code}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2 text-gray-600">
                            <CalendarDays size={16} />
                            <span>{formatDate(session.startedAt || session.createdAt)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Users size={17} />
                            <span>{getPlayersCount(session)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="inline-flex px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                            {getStatusLabel(session.status)}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button
                            onClick={() => handleViewResults(session)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 text-blue-600 font-semibold text-sm hover:bg-blue-100 transition"
                          >
                            <Eye size={16} />
                            View Results
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden divide-y divide-gray-100">
                {sessions.map((session, index) => (
                  <div key={getSessionId(session) || index} className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 shrink-0 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                          <Trophy size={18} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{getQuizTitle(session)}</h3>
                          {session.code && (
                            <p className="text-xs text-gray-400 mt-1">Room: {session.code}</p>
                          )}
                        </div>
                      </div>
                      <span className="shrink-0 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                        {getStatusLabel(session.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-5 mt-5 text-sm text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays size={15} />
                        {formatDate(session.startedAt || session.createdAt)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users size={15} />
                        {getPlayersCount(session)} players
                      </div>
                    </div>
                    <button
                      onClick={() => handleViewResults(session)}
                      className="w-full mt-5 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                    >
                      <Eye size={17} />
                      View Results
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
