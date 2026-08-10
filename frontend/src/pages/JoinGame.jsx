import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sessionService } from "../services/sessionService";

export default function JoinGame() {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e) => {
    e.preventDefault();

    if (!roomCode.trim() || !nickname.trim()) {
      alert("Fill all fields");
      return;
    }

    try {
      setLoading(true);

      const participant = await sessionService.joinSession({
        roomCode: roomCode.toUpperCase(),
        nickname,
      });

      localStorage.setItem(
        `participant_${participant.sessionId}`,
        String(participant.id)
      );

      navigate(`/lobby/${roomCode.toUpperCase()}`);
    } catch (err) {
      alert(err.response?.data?.message || "Unable to join");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <form
        onSubmit={handleJoin}
        className="bg-white w-full max-w-md rounded-2xl shadow-lg p-8"
      >
        <h1 className="text-3xl font-bold text-center mb-8">Join Game</h1>

        <div className="mb-5">
          <label className="block mb-2 font-medium">Room Code</label>
          <input
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            className="w-full border rounded-xl px-4 py-3 uppercase"
            placeholder="ABC123"
          />
        </div>

        <div className="mb-8">
          <label className="block mb-2 font-medium">Nickname</label>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full border rounded-xl px-4 py-3"
            placeholder="Your nickname"
          />
        </div>

        <button
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-semibold"
        >
          {loading ? "Joining..." : "Join Game"}
        </button>
      </form>
    </div>
  );
}
