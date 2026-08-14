import { Pencil, Play, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { sessionService } from "../../services/sessionService";

export default function QuizTable({ quizzes = [], onDelete }) {
  const navigate = useNavigate();

  const handleStartSession = async (quizId) => {
    if (!quizId) {
      alert("Invalid quiz. Please refresh the page.");
      return;
    }

    try {
      const session = await sessionService.startSession(quizId);
      navigate(`/lobby/${session.code}`);
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || "Failed to start session";
      alert(message);
    }
  };

  if (quizzes.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
        <p className="text-gray-500 mb-4">You don't have any quizzes yet.</p>
        <Link
          to="/create-quiz"
          className="inline-flex items-center px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
        >
          Create your first quiz →
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-bold text-gray-900">Recent Quizzes</h3>
        <button className="text-sm text-blue-600 font-medium hover:underline">
          View all
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-6 py-3 font-medium">NAME</th>
              <th className="px-6 py-3 font-medium">CREATED AT</th>
              <th className="px-6 py-3 font-medium">STATUS</th>
              <th className="px-6 py-3 font-medium text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {quizzes.map((quiz) => (
              <tr key={quiz.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">
                  {quiz.title}
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {new Date(quiz.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      quiz.status === "PUBLISHED"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {quiz.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      to={`/create-quiz/${quiz.id}`}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                    >
                      <Pencil size={16} />
                    </Link>
                    <button
                      onClick={() => handleStartSession(quiz.id)}
                      className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition"
                      title="Start Session"
                    >
                      <Play size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(quiz.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-3 border-t border-gray-100 text-center">
        <Link
          to="/history"
          className="text-sm text-blue-600 font-medium hover:underline"
        >
          View More History →
        </Link>
      </div>
    </div>
  );
}
