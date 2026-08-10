import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Bell, Copy, User, X } from "lucide-react";
import { Client } from "@stomp/stompjs";
import { sessionService } from "../services/sessionService";

function formatCode(code) {
  if (!code || code.length !== 6) return code;
  return `${code.slice(0, 3)} - ${code.slice(3)}`;
}

export default function Lobby() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState(null);
  const copyTimeoutRef = useRef(null);

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isOrganizer =
    session?.organizerId != null &&
    Number(storedUser.id) === Number(session.organizerId);
  const username = storedUser.username || "Organizer";

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }

    if (!code) {
      navigate("/dashboard");
      return;
    }

    let cancelled = false;

    sessionService
      .getSessionByCode(code)
      .then(async (data) => {
        if (cancelled) return;
        setSession(data);
        const players = await sessionService.getParticipants(data.id);
        if (!cancelled) setParticipants(players);
      })
      .catch(() => {
        if (!cancelled) setError("Session not found");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [code, navigate]);

  useEffect(() => {
    if (!session) return;

    const interval = setInterval(async () => {
      try {
        const players = await sessionService.getParticipants(session.id);
        setParticipants(players);
      } catch {
        // ignore polling errors
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    if (!session) return;

    const stompClient = new Client({
      brokerURL: "ws://localhost:8080/ws",
      reconnectDelay: 5000,
      onConnect: () => {
        stompClient.subscribe(`/topic/session/${session.id}`, (message) => {
          const body = JSON.parse(message.body);

          if (body.type === "EVENT" && body.payload.event === "GAME_STARTED") {
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            const isHost =
              session.organizerId != null &&
              Number(user.id) === Number(session.organizerId);

            navigate(isHost ? `/host/${session.id}` : `/game/${session.id}`);
          }
        });
      },
    });

    stompClient.activate();
    return () => stompClient.deactivate();
  }, [session, navigate]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Failed to copy code");
    }
  };

  const handleCancel = async () => {
    const confirmed = window.confirm(
      "Cancel this session and return to dashboard?"
    );
    if (!confirmed) return;

    setCancelling(true);
    try {
      await sessionService.cancelSession(code);
      navigate("/dashboard");
    } catch (err) {
      const message = err.response?.data?.message || "Failed to cancel session";
      alert(message);
    } finally {
      setCancelling(false);
    }
  };

  const handleStartGame = async () => {
    try {
      await sessionService.startGame(session.id);
      navigate(`/host/${session.id}`);
    } catch (err) {
      alert(err.response?.data?.message || "Cannot start game");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex gap-2">
          <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
          <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse [animation-delay:150ms]" />
          <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse [animation-delay:300ms]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-600">{error}</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="text-blue-600 font-medium hover:underline"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      <div className="absolute bottom-0 left-0 w-64 h-64 opacity-5 pointer-events-none">
        <svg viewBox="0 0 200 200" className="w-full h-full text-blue-600">
          <polygon
            points="100,10 130,70 190,70 140,110 160,170 100,130 40,170 60,110 10,70 70,70"
            fill="currentColor"
          />
        </svg>
      </div>
      <div className="absolute bottom-0 right-0 w-64 h-64 opacity-5 pointer-events-none">
        <svg viewBox="0 0 200 200" className="w-full h-full text-indigo-600">
          <polygon
            points="100,10 130,70 190,70 140,110 160,170 100,130 40,170 60,110 10,70 70,70"
            fill="currentColor"
          />
        </svg>
      </div>

      <header className="flex justify-between items-center px-8 py-6">
        <h1 className="text-2xl font-bold text-blue-600">QuizMaster</h1>
        <div className="flex items-center gap-4">
          <button className="p-2 text-gray-400 hover:text-gray-600 transition">
            <Bell size={20} />
          </button>
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <User size={16} className="text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">{username}</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 flex flex-col items-center">
        <div className="w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-6">
          <p className="text-center text-xs font-semibold tracking-widest text-blue-500 mb-6">
            JOIN AT QUIZMASTER.APP
          </p>

          <div className="flex items-center justify-center gap-3">
            <div className="border-2 border-dashed border-gray-200 rounded-xl px-8 py-4">
              <span className="text-4xl font-bold tracking-wider text-gray-900 font-mono">
                {formatCode(code)}
              </span>
            </div>
            <button
              onClick={handleCopy}
              className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition shadow-sm"
              title="Copy code"
            >
              <Copy size={20} />
            </button>
          </div>

          {copied && (
            <p className="text-center text-sm text-green-600 mt-3 font-medium">
              Code copied!
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 bg-orange-50 text-orange-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500" />
          </span>
          Waiting for players...
        </div>

        {session && (
          <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-900">Quiz</h2>
              <span className="text-xs font-medium bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">
                Lobby Open
              </span>
            </div>
            <p className="text-gray-700 font-medium">{session.quizTitle}</p>
            <p className="text-sm text-gray-400 mt-1">Status: {session.status}</p>
            <div className="mt-6 border-t pt-4">
              <h3 className="font-semibold mb-3">
                Players ({participants.length})
              </h3>

              <div className="space-y-2">
                {participants.length === 0 ? (
                  <p className="text-sm text-gray-400">No players joined yet</p>
                ) : (
                  participants.map((player) => (
                    <div
                      key={player.id}
                      className="flex justify-between bg-gray-50 rounded-lg px-4 py-2"
                    >
                      <span>{player.nickname}</span>
                      <span className="text-gray-400">{player.score} pts</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {isOrganizer && (
          <button
            onClick={handleStartGame}
            className="mb-4 bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition shadow-lg"
          >
            Start Game
          </button>
        )}

        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="flex items-center gap-2 px-8 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 transition shadow-sm disabled:opacity-50"
        >
          <X size={18} />
          {cancelling ? "Cancelling..." : "Cancel"}
        </button>

        <p className="text-sm text-gray-400 mt-4">
          Share the code with players to join
        </p>
      </main>
    </div>
  );
}
