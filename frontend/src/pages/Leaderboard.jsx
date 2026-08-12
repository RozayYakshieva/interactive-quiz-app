import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Client } from "@stomp/stompjs";
import { Crown, LogOut, Sparkles, Star, Trophy, User } from "lucide-react";
import { sessionService } from "../services/sessionService";
import { clearAuth } from "../api/axios";

const AVATAR_GRADIENTS = [
  "from-blue-400 to-blue-600",
  "from-violet-400 to-violet-600",
  "from-emerald-400 to-emerald-600",
  "from-orange-400 to-orange-600",
  "from-pink-400 to-pink-600",
  "from-cyan-400 to-cyan-600",
  "from-amber-400 to-amber-600",
  "from-rose-400 to-rose-600",
];

function getInitials(name) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getAvatarGradient(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

function Avatar({ name, size = "md", ring = false }) {
  const sizes = {
    sm: "w-10 h-10 text-sm",
    md: "w-14 h-14 text-base",
    lg: "w-20 h-20 text-xl",
    xl: "w-24 h-24 text-2xl",
  };

  return (
    <div
      className={`
        ${sizes[size]}
        rounded-full
        bg-gradient-to-br ${getAvatarGradient(name)}
        flex items-center justify-center
        text-white font-bold shadow-md
        ${ring ? "ring-4 ring-white" : ""}
      `}
    >
      {getInitials(name)}
    </div>
  );
}

function PodiumPlace({ player, place, isCurrentUser }) {
  const configs = {
    1: {
      order: "order-2",
      height: "h-44",
      width: "w-40",
      bg: "bg-gradient-to-b from-amber-100 to-amber-200",
      badge: "bg-amber-400 text-white",
      nameColor: "text-amber-700",
      scoreColor: "text-amber-600",
      avatarSize: "xl",
      showCrown: true,
      label: "1",
    },
    2: {
      order: "order-1",
      height: "h-32",
      width: "w-36",
      bg: "bg-gradient-to-b from-slate-100 to-slate-200",
      badge: "bg-slate-400 text-white",
      nameColor: "text-slate-700",
      scoreColor: "text-blue-600",
      avatarSize: "lg",
      showCrown: false,
      label: "2",
    },
    3: {
      order: "order-3",
      height: "h-28",
      width: "w-36",
      bg: "bg-gradient-to-b from-orange-50 to-orange-100",
      badge: "bg-orange-400 text-white",
      nameColor: "text-slate-700",
      scoreColor: "text-blue-600",
      avatarSize: "lg",
      showCrown: false,
      label: "3",
    },
  };

  const config = configs[place];
  const displayName = isCurrentUser ? `You (${player.nickname || player.userName})` : player.userName;

  return (
    <div className={`flex flex-col items-center ${config.order}`}>
      <div className="relative mb-3">
        {config.showCrown && (
          <Crown
            size={28}
            className="absolute -top-7 left-1/2 -translate-x-1/2 text-amber-400 fill-amber-300 drop-shadow"
          />
        )}
        <Avatar name={player.userName} size={config.avatarSize} ring />
        <span
          className={`
            absolute -bottom-1 -right-1 w-7 h-7 rounded-full
            ${config.badge} text-sm font-bold
            flex items-center justify-center shadow
          `}
        >
          {config.label}
        </span>
      </div>

      <div
        className={`
          ${config.width} ${config.height} ${config.bg}
          rounded-2xl shadow-lg flex flex-col items-center justify-end pb-4 px-3
          ${isCurrentUser ? "ring-2 ring-violet-400" : ""}
        `}
      >
        <p className={`font-bold text-center truncate w-full ${config.nameColor}`}>
          {displayName}
        </p>
        <p className={`font-semibold mt-1 ${config.scoreColor}`}>
          {player.score.toLocaleString()} pts
        </p>
      </div>
    </div>
  );
}

function LeaderboardRow({ player, isCurrentUser }) {
  const displayName = isCurrentUser
    ? `You (${player.nickname || player.userName})`
    : player.userName;

  return (
    <div
      className={`
        flex items-center gap-4 px-5 py-4 rounded-2xl transition-all
        ${isCurrentUser
          ? "bg-violet-50 border-2 border-violet-300 shadow-sm"
          : "hover:bg-slate-50"
        }
      `}
    >
      {isCurrentUser ? (
        <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center shrink-0">
          <Star size={16} className="text-white fill-white" />
        </div>
      ) : (
        <span className="w-8 text-center font-bold text-slate-400 shrink-0">
          {player.position}
        </span>
      )}

      <Avatar name={player.userName} size="sm" />

      <span
        className={`flex-1 font-semibold truncate ${isCurrentUser ? "text-violet-700" : "text-slate-800"}`}
      >
        {displayName}
      </span>

      <span
        className={`font-bold text-lg shrink-0 ${isCurrentUser ? "text-violet-600" : "text-blue-600"}`}
      >
        {player.score.toLocaleString()} pts
      </span>
    </div>
  );
}

export default function Leaderboard() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [finishing, setFinishing] = useState(false);

  const currentParticipantId = localStorage.getItem(`participant_${sessionId}`);

  const isCurrentPlayer = (player) =>
    currentParticipantId &&
    String(player.participantId) === String(currentParticipantId);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await sessionService.getLeaderboard(sessionId);
        if (cancelled) return;
        setPlayers(data);
        setError(null);
      } catch {
        if (!cancelled) setError("Failed to load leaderboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  useEffect(() => {
    const client = new Client({
      brokerURL: "ws://localhost:8080/ws",
      reconnectDelay: 5000,

      onConnect: () => {
        client.subscribe(`/topic/session/${sessionId}`, (message) => {
          const body = JSON.parse(message.body);

          if (body.type === "EVENT" && body.payload?.event === "GAME_FINISHED") {
            sessionService
              .getLeaderboard(sessionId)
              .then((data) => {
                setPlayers(data);
                setError(null);
              })
              .catch(() => {});
          }
        });
      },
    });

    client.activate();
    return () => client.deactivate();
  }, [sessionId]);

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  const handleFinishGame = async () => {
    setFinishing(true);
    try {
      await sessionService.finishGame(sessionId);
    } catch {
      // Game may already be finished — still redirect
    } finally {
      localStorage.removeItem(`participant_${sessionId}`);
      navigate("/dashboard");
    }
  };

  const topThree = players.slice(0, 3);
  const rest = players.slice(3);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <p className="text-slate-600">{error}</p>
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
      <div className="absolute top-20 left-10 text-blue-200 opacity-60 pointer-events-none">
        <Sparkles size={24} />
      </div>
      <div className="absolute top-40 right-16 text-amber-200 opacity-60 pointer-events-none">
        <Star size={20} />
      </div>
      <div className="absolute bottom-32 left-20 text-violet-200 opacity-50 pointer-events-none">
        <Sparkles size={18} />
      </div>
      <div className="absolute top-1/3 right-8 text-4xl opacity-30 pointer-events-none select-none">
        🎉
      </div>

      <header className="flex justify-between items-center px-8 py-6 relative z-10">
        <h1 className="text-2xl font-bold text-blue-600">QuizMaster</h1>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition"
        >
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
            <User size={18} className="text-blue-600" />
          </div>
          <span className="font-medium">Log out</span>
          <LogOut size={16} className="text-slate-400" />
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16 relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
            <Trophy size={32} className="text-amber-500" />
          </div>
          <h2 className="text-4xl font-black text-blue-700 mb-1">Leaderboard</h2>
          <p className="text-slate-500 text-lg">Top Performers</p>
        </div>

        {players.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
            <p className="text-slate-500 text-lg">No players in this game yet.</p>
          </div>
        ) : (
          <>
            {topThree.length > 0 && (
              <div className="flex items-end justify-center gap-4 mb-10 px-2">
                {topThree.map((player) => (
                  <PodiumPlace
                    key={player.participantId}
                    player={player}
                    place={player.position}
                    isCurrentUser={isCurrentPlayer(player)}
                  />
                ))}
              </div>
            )}

            {rest.length > 0 && (
              <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
                <div className="divide-y divide-slate-100 px-2 py-2">
                  {rest.map((player) => (
                    <LeaderboardRow
                      key={player.participantId}
                      player={player}
                      isCurrentUser={isCurrentPlayer(player)}
                    />
                  ))}
                </div>
              </div>
            )}

            {players.length <= 3 && players.length > 0 && (
              <div className="bg-white rounded-3xl shadow-lg border border-slate-100 mt-6 p-6 text-center text-slate-500">
                {players.length === 1
                  ? "Solo run — great job!"
                  : "Small but mighty leaderboard!"}
              </div>
            )}
          </>
        )}

        <div className="mt-10 flex justify-center">
          <button
            onClick={handleFinishGame}
            disabled={finishing}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-lg px-12 py-4 rounded-full shadow-lg shadow-blue-200 transition-all hover:scale-105 active:scale-95"
          >
            {finishing ? "Finishing..." : "Finish Game"}
          </button>
        </div>
      </main>
    </div>
  );
}
