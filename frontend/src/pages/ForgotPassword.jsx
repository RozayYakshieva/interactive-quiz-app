import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowLeft } from "lucide-react";
import Header from "../components/layout/Header";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { authService } from "../services/authService";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const redirectTimeoutRef = useRef(null);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!newPassword) {
      setError("Please enter a new password.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const response = await authService.resetPassword({
        email: email.trim(),
        newPassword,
      });
      setSuccess(response.message || "Password reset successfully.");
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Unable to reset password. Please check your email and try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 md:p-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Reset Password
            </h2>
            <p className="text-gray-500 text-sm">
              Enter your email and choose a new password
            </p>
          </div>

          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <Input
              label="Email Address"
              type="email"
              placeholder="name@example.com"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-700">
                {success}
              </div>
            )}

            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline"
            >
              <ArrowLeft size={16} />
              Back to Log In
            </Link>
          </div>
        </Card>
      </main>
    </div>
  );
}
