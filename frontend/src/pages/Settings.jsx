import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Lock, Mail, User, Settings as SettingsIcon } from "lucide-react";
import Sidebar from "../components/dashboard/Sidebar";
import { authService } from "../services/authService";
import { clearAuth, getAuthToken } from "../api/axios";

export default function Settings() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const token = getAuthToken();
    const storedUser = localStorage.getItem("user");

    if (!token && !storedUser) {
      navigate("/login");
      return;
    }

    let cancelled = false;

    const loadProfile = async () => {
      try {
        const profile = await authService.getProfile();
        if (cancelled) return;
        setFullName(profile.username || "");
        setUsername(profile.username || "");
        setEmail(profile.email || "");
      } catch (error) {
        if (cancelled) return;
        if (error.response?.status === 401) {
          clearAuth();
          navigate("/login");
          return;
        }

        try {
          const localUser = JSON.parse(storedUser || "{}");
          setFullName(localUser.username || "");
          setUsername(localUser.username || "");
          setEmail(localUser.email || "");
        } catch {
          // ignore invalid local user
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setProfileError("");
    setProfileSuccess("");

    if (!fullName.trim() || !email.trim()) {
      setProfileError("Full name and email are required.");
      return;
    }

    try {
      setSavingProfile(true);
      const updated = await authService.updateProfile({
        username: fullName.trim(),
        email: email.trim(),
      });

      setFullName(updated.username || "");
      setUsername(updated.username || "");
      setEmail(updated.email || "");

      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...storedUser,
          username: updated.username,
          email: updated.email,
        })
      );

      setProfileSuccess("Profile updated successfully.");
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to update profile.";
      setProfileError(message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    try {
      setSavingPassword(true);
      await authService.changePassword({
        currentPassword,
        newPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess("Password changed successfully.");
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to change password.";
      setPasswordError(message);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-gray-500 text-lg animate-pulse">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          <header className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <SettingsIcon size={23} />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            </div>
            <p className="text-gray-500">Manage your account details and security.</p>
          </header>

          <div className="space-y-6">
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Account Information</h2>

              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        setUsername(e.target.value);
                      }}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <User
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setFullName(e.target.value);
                      }}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="Enter your username"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>

                {profileError && (
                  <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                    {profileError}
                  </div>
                )}

                {profileSuccess && (
                  <div className="rounded-xl bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-700">
                    {profileSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-60"
                >
                  {savingProfile ? "Saving..." : "Save Changes"}
                </button>
              </form>
            </section>

            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Change Password</h2>

              <form onSubmit={handleChangePassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="Enter current password"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="Enter new password"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                {passwordError && (
                  <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                    {passwordError}
                  </div>
                )}

                {passwordSuccess && (
                  <div className="rounded-xl bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-700">
                    {passwordSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={savingPassword}
                  className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-60"
                >
                  {savingPassword ? "Updating..." : "Update Password"}
                </button>
              </form>
            </section>

            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Session</h2>
              <p className="text-sm text-gray-500 mb-5">
                Sign out of your account on this device.
              </p>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-red-200 text-red-600 font-semibold hover:bg-red-50 transition"
              >
                <LogOut size={18} />
                Logout
              </button>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
