import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import Header from "../components/layout/Header";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { authService } from "../services/authService";
import { setAuthToken } from "../api/axios";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await authService.login(email, password);

      if (!data?.token) {
        alert("Login failed: server did not return a token");
        return;
      }

      setAuthToken(data.token);
      localStorage.setItem("user", JSON.stringify(data));
      navigate("/dashboard");
    } catch (error) {
      alert(error.message || "Error logging in");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 md:p-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome Back!
            </h2>
            <p className="text-gray-500 text-sm">
              Enter your details to access your account
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
              label="Password"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="flex justify-end -mt-3">
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full mt-2">
              Log In
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-8">
            Don&apos;t have an account?{" "}
            <Link
              to="/signup"
              className="font-semibold text-blue-600 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </Card>
      </main>
    </div>
  );
}
