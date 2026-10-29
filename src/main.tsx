import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './authContext.tsx';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from "react-hot-toast";
import * as Sentry from "@sentry/react";
import { isSensitiveTelemetryPath, sanitizeBreadcrumb, sanitizeReplayFrame, sanitizeTelemetryEvent, sanitizeTelemetrySpan } from "@/lib/telemetryPrivacy";

// Initialize Sentry for error tracking and performance monitoring
// Reset links carry credentials in the path: do not start telemetry/replay there.
if (!isSensitiveTelemetryPath(window.location.pathname)) Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  
  integrations: [
    Sentry.browserTracingIntegration({
      // Disable automatic fetch instrumentation to prevent interference
      // We'll manually capture important errors where needed
      traceFetch: false,
      traceXHR: false,
    }),
    Sentry.replayIntegration({
      maskAllText: true,    // mask customer data (PII) in session replays — this is a CRM
      blockAllMedia: true,
      maskAllInputs: true,
      networkCaptureBodies: false,
      beforeAddRecordingEvent: sanitizeReplayFrame,
    }),
  ],

  // Performance Monitoring (10% is plenty for prod; 1.0 was a dev-grade default)
  tracesSampleRate: 0.1,
  
  // Distributed tracing - connects frontend to backend traces
  tracePropagationTargets: [
    "localhost",
    /^http:\/\/localhost:8000\/api/,
    /^https:\/\/pathsixsolutions-backend\.fly\.dev\/api/,
  ],

  // Session Replay
  replaysSessionSampleRate: 0.1, // 10% of normal sessions
  replaysOnErrorSampleRate: 1.0, // 100% of error sessions
  
  // Don't attach PII automatically (privacy — this app holds customer data)
  sendDefaultPii: false,
  
  // Environment detection
  environment: import.meta.env.MODE,
  
  beforeSend: sanitizeTelemetryEvent,
  beforeSendTransaction: sanitizeTelemetryEvent,
  beforeSendSpan: sanitizeTelemetrySpan,
  beforeBreadcrumb: sanitizeBreadcrumb,
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<div className="p-8 text-center"><h1 className="text-2xl font-bold text-red-600">An error has occurred</h1><p className="mt-2 text-gray-600">Our team has been notified. Please refresh the page.</p></div>}>
      <BrowserRouter>
        <AuthProvider>
          <>
            <App />
            <Toaster position="top-center" />
          </>
        </AuthProvider>
      </BrowserRouter>
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
