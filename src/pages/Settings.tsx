import { Link } from "react-router-dom";
import { useAuth } from "@/authContext";
import * as Sentry from "@sentry/react";

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Account</h2>

        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold">
            {user?.email?.[0]?.toUpperCase() || "U"}
          </div>
          <span className="text-gray-700 text-sm">{user?.email}</span>
        </div>

        <Link
          to="/change-password"
          className="text-sm text-blue-600 hover:underline"
        >
          Change Password
        </Link>
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
