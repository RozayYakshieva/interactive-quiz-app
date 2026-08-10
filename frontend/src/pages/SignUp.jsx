import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/authService";

export default function SignUp() {
  const navigate = useNavigate();

  const [role, setRole] = useState("ORGANIZER");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inputClassName = `
    w-full h-[46px] px-4 rounded-[12px] bg-[#f7f8fa] border border-transparent
    text-[12px] text-gray-700 outline-none placeholder:text-[#aeb4c0]
    focus:bg-white focus:border-[#7377ef] focus:ring-2 focus:ring-[#7377ef]/10 transition
  `;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter a password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      await authService.register({
        username: fullName.trim(),
        email: email.trim(),
        password,
        role,
      });
      navigate("/login");
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Unable to create account. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-800 flex flex-col">
      <header className="w-full px-8 md:px-10 py-6 flex items-center justify-between">
        <Link
          to="/"
          className="text-xl md:text-2xl font-extrabold tracking-tight text-[#6267e8]"
        >
          QuizMaster
        </Link>
        <Link
          to="/login"
          className="text-sm font-medium text-[#6366e8] hover:text-[#4f46e5] transition-colors"
        >
          Log In
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[360px]">
          <div className="bg-white rounded-[20px] shadow-[0_12px_35px_rgba(80,80,150,0.10)] px-9 py-9">
            <div className="text-center mb-5">
              <h1 className="text-[24px] font-extrabold text-[#253044]">
                Create Account
              </h1>
              <p className="text-[13px] text-[#9aa1b1] mt-1">
                Choose your role and fill in the details
              </p>
            </div>

            <div className="w-full h-[43px] bg-[#f1f1f4] rounded-full p-1 flex mb-6">
              <button
                type="button"
                onClick={() => setRole("ORGANIZER")}
                className={`
                  flex-1 rounded-full text-[12px] font-bold transition-all duration-200
                  ${
                    role === "ORGANIZER"
                      ? "bg-[#eef0ff] text-[#6569ed] shadow-sm"
                      : "text-[#b0b4bf] hover:text-[#858997]"
                  }
                `}
              >
                Organizer
              </button>
              <button
                type="button"
                onClick={() => setRole("PARTICIPANT")}
                className={`
                  flex-1 rounded-full text-[12px] font-bold transition-all duration-200
                  ${
                    role === "PARTICIPANT"
                      ? "bg-[#eef0ff] text-[#6569ed] shadow-sm"
                      : "text-[#b0b4bf] hover:text-[#858997]"
                  }
                `}
              >
                Participant
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#30394b] mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  className={inputClassName}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#30394b] mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  className={inputClassName}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#30394b] mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={inputClassName}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#30394b] mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={inputClassName}
                />
              </div>

              {error && (
                <div className="rounded-[10px] bg-red-50 border border-red-100 px-3 py-2.5 text-[11px] font-medium text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="
                  w-full h-[46px] mt-1 rounded-full
                  bg-gradient-to-r from-[#6366ed] to-[#9151ee]
                  text-white text-[13px] font-bold
                  shadow-[0_8px_18px_rgba(111,91,230,0.25)]
                  hover:from-[#5759df] hover:to-[#8445df]
                  hover:-translate-y-[1px] active:translate-y-0
                  disabled:opacity-60 disabled:cursor-not-allowed transition-all
                "
              >
                {loading ? "Creating Account..." : "Sign Up"}
              </button>
            </form>

            <p className="text-center text-[12px] text-[#8c93a1] mt-6">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-[#6366ed] hover:text-[#4f46e5] transition"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
