import { Routes, Route } from "react-router-dom";

import LandingPage from "../pages/LandingPage";
import SignUp from "../pages/SignUp";
import Login from "../pages/Login";
import Lobby from "../pages/Lobby";
import Leaderboard from "../pages/Leaderboard";
import Game from "../pages/Game";
import Dashboard from "../pages/Dashboard";
import CreateQuiz from "../pages/CreateQuiz";
import JoinGame from "../pages/JoinGame";
import HostQuestion from "../pages/HostQuestion";
import History from "../pages/History";
import Settings from "../pages/Settings";
import ForgotPassword from "../pages/ForgotPassword";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/join" element={<JoinGame />} />
      <Route path="/lobby/:code" element={<Lobby />} />
      <Route path="/game/:sessionId" element={<Game />} />
      <Route path="/leaderboard/:sessionId" element={<Leaderboard />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/history" element={<History />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/create-quiz" element={<CreateQuiz />} />
      <Route path="/create-quiz/:id" element={<CreateQuiz />} />
      <Route path="/host/:sessionId" element={<HostQuestion />} />
    </Routes>
  );
}
