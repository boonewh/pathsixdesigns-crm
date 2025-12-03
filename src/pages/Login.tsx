import { useState } from "react";
import { useAuth } from "@/authContext";
import { useNavigate } from "react-router-dom";
import { FormWrapper } from "@/components/ui/FormWrapper";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import * as Sentry from "@sentry/react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await apiFetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data?.token) {
        login(data.token);
        navigate("/dashboard");
        return;
      }

      // Handle bad credentials
      if (res.status === 401) {
        setErrorMessage("Your email or password is incorrect.");
        return;
      }

      // Other server errors
      setErrorMessage(data?.error || "Unable to login. Please try again.");
      
    } catch (err) {
      // Capture login errors in Sentry
      Sentry.captureException(err, {
        extra: {
          email,
          context: 'Login attempt failed',
        },
      });
      
      setErrorMessage("Unable to reach server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4">
      <FormWrapper onSubmit={handleSubmit}>
        <h1 className="text-2xl font-semibold text-center text-foreground mb-4">
          Login to PathSix CRM
        </h1>

        <div className="flex justify-center">
          <div className="w-full max-w-sm space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Log In"}
            </Button>

            {errorMessage && (
              <p className="text-red-600 text-sm text-center mt-2">{errorMessage}</p>
            )}

            <div className="text-right mt-1">
              <a
                href="/forgot-password"
                className="text-sm text-blue-600 hover:underline"
              >
                Forgot password?
              </a>
            </div>
          </div>
        </div>
      </FormWrapper>
    </div>
  );
}
