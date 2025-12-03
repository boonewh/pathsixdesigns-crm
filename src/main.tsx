import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './authContext.tsx';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from "react-hot-toast";
import * as Sentry from "@sentry/react";

// Initialize Sentry for error tracking and performance monitoring
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  
  integrations: [
    Sentry.browserTracingIntegration({
      // Disable automatic fetch instrumentation to prevent interference
      // We'll manually capture important errors where needed
      traceFetch: false,
      traceXHR: false,
    }),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],

  // Performance Monitoring
  tracesSampleRate: 1.0, // Capture 100% in dev, can reduce in production
  
  // Distributed tracing - connects frontend to backend traces
  tracePropagationTargets: [
    "localhost",
    /^http:\/\/localhost:8000\/api/,
    /^https:\/\/pathsix-backend\.fly\.dev\/api/,
  ],

  // Session Replay
  replaysSessionSampleRate: 0.1, // 10% of normal sessions
  replaysOnErrorSampleRate: 1.0, // 100% of error sessions
  
  // Send default PII for better debugging
  sendDefaultPii: true,
  
  // Environment detection
  environment: import.meta.env.MODE,
  
  // Before sending events, you can filter or modify them
  beforeSend(event, hint) {
    // Don't send events for known non-critical errors
    if (event.exception) {
      const errorMessage = event.exception.values?.[0]?.value || '';
      // Filter out expected errors that aren't actionable
      if (errorMessage.includes('Failed to fetch') && event.level === 'error') {
        // Still log network errors but at a lower level
        event.level = 'warning';
      }
    }
    return event;
  },
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