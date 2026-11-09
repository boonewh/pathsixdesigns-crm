import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/authContext";
import * as Sentry from "@sentry/react";
import { API_BASE } from "@/lib/api";

// The AI connection pages are served by the backend, beside its /api routes.
const BACKEND = API_BASE.replace(/\/api\/?$/, "");

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="p-4 lg:p-6 max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="bg-white rounded-lg border">
        <h2 className="border-b px-4 py-3 text-base font-semibold">Account</h2>
        <div className="p-4">

        <div className="flex items-center gap-3 mb-4">
          <div className="bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center font-bold">
            {user?.email?.[0]?.toUpperCase() || "U"}
          </div>
          <span className="text-sm">{user?.email}</span>
        </div>

        <Button asChild variant="outline" size="sm">
          <Link to="/change-password">Change password</Link>
        </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border">
        <h2 className="border-b px-4 py-3 text-base font-semibold">AI connections</h2>
        <div className="p-4 space-y-3">
          <p className="text-sm text-gray-600">
            Use your own AI app, like ChatGPT, Claude or Gemini, with your PathSix records.
            Each new record or change needs your approval before it is saved.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <a href={`${BACKEND}/connect`} target="_blank" rel="noopener noreferrer">Connect your AI</a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={`${BACKEND}/oauth/connections`} target="_blank" rel="noopener noreferrer">Manage AI connections</a>
            </Button>
          </div>
        </div>
      </div>

      {/* Sentry Test Section - Only visible in development */}
      {import.meta.env.DEV && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-yellow-800">Sentry Error Testing</h2>
          <p className="text-sm text-yellow-700 mb-4">
            These buttons are only visible in development mode. Use them to test Sentry error tracking.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                throw new Error('This is a test error from Settings page!');
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Throw Test Error
            </button>
            <button
              onClick={() => {
                Sentry.captureMessage('This is a test message from Settings page', 'info');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Send Test Message
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
