import type { Breadcrumb, Event as TelemetryEvent, spanToJSON } from "@sentry/react";

type SpanJSON = ReturnType<typeof spanToJSON>;

const methods = new Set(["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]);
const errorTypes = new Set(["Error", "TypeError", "SyntaxError", "RangeError", "ReferenceError", "URIError", "EvalError", "AggregateError", "DOMException"]);

export function isSensitiveTelemetryPath(path: string): boolean {
  try { return /^\/reset-password(?:\/|$)/i.test(decodeURIComponent(new URL(path, "https://redaction.invalid").pathname)); }
  catch { return true; }
}

/** Keep the endpoint, never URL credentials, query terms, fragments or reset tokens. */
export function telemetryUrl(value: string): string {
  try {
    const url = new URL(value, "https://redaction.invalid");
    if (!["http:", "https:"].includes(url.protocol)) return "[redacted-url]";
    const decodedPath = decodeURIComponent(url.pathname);
    const resetIndex = decodedPath.search(/\/reset-password(?:\/|$)/i);
    const path = resetIndex >= 0
      ? decodedPath.slice(0, resetIndex) + "/reset-password/[redacted]"
      : url.pathname.replace(/\/(?:\d+|[0-9a-f]{8}-[0-9a-f-]{27,})(?=\/|$)/ig, "/[id]");
    return /^[a-z][a-z\d+.-]*:/i.test(value) ? url.origin + path : path;
  } catch { return "[redacted-url]"; }
}

function safeData(data: Record<string, unknown> = {}): Record<string, string | number> {
  const result: Record<string, string | number> = {};
  for (const key of ["url", "from", "to", "http.url", "http.target", "http.route"]) {
    if (typeof data[key] === "string") result[key] = telemetryUrl(data[key]);
  }
  for (const key of ["method", "http.method", "http.request.method"]) {
    const value = data[key];
    if (typeof value === "string" && methods.has(value.toUpperCase())) result[key] = value.toUpperCase();
  }
  for (const key of ["status", "status_code", "http.status_code", "http.response.status_code"]) {
    const value = data[key];
    if (typeof value === "number" && Number.isInteger(value) && value >= 100 && value <= 599) result[key] = value;
  }
  return result;
}

export function sanitizeBreadcrumb(crumb: Breadcrumb): Breadcrumb | null {
  // UI/console messages can include typed customer data, emails and API bodies.
  if (!["navigation", "fetch", "xhr"].includes(crumb.category ?? "")) return null;
  return { category: crumb.category, type: crumb.type, level: crumb.level,
    timestamp: crumb.timestamp, data: safeData(crumb.data) };
}

export function sanitizeTelemetrySpan(span: SpanJSON): SpanJSON {
  return { ...span, description: span.description && /^(?:https?:\/\/|\/)/.test(span.description)
    ? telemetryUrl(span.description) : "CRM operation", data: safeData(span.data) };
}

/** Preserve stack locations and trace linkage, not arbitrary CRM content. */
export function sanitizeTelemetryEvent<T extends TelemetryEvent>(event: T): T {
  const networkFailure = event.exception?.values?.some(value => value.value?.includes("Failed to fetch"));
  return {
    ...event,
    level: networkFailure && event.level === "error" ? "warning" : event.level,
    message: event.message ? "CRM diagnostic event" : undefined,
    logentry: event.logentry ? { message: "CRM diagnostic event" } : undefined,
    user: undefined, tags: undefined, threads: undefined, server_name: undefined, fingerprint: undefined,
    extra: safeData(event.extra),
    request: event.request ? { url: event.request.url ? telemetryUrl(event.request.url) : undefined,
      method: event.request.method && methods.has(event.request.method.toUpperCase()) ? event.request.method.toUpperCase() : undefined } : undefined,
    transaction: event.transaction ? telemetryUrl(event.transaction) : undefined,
    breadcrumbs: event.breadcrumbs?.map(sanitizeBreadcrumb).filter((crumb): crumb is Breadcrumb => crumb !== null),
    spans: event.spans?.map(sanitizeTelemetrySpan),
    contexts: event.contexts?.trace ? { trace: { trace_id: event.contexts.trace.trace_id,
      span_id: event.contexts.trace.span_id, parent_span_id: event.contexts.trace.parent_span_id,
      op: event.contexts.trace.op, status: event.contexts.trace.status, origin: event.contexts.trace.origin } } : undefined,
    exception: event.exception ? { values: event.exception.values?.map(value => ({
      type: errorTypes.has(value.type ?? "") ? value.type : "Error",
      value: "CRM frontend error (private details omitted)",
      mechanism: value.mechanism ? { type: value.mechanism.type, handled: value.mechanism.handled, synthetic: value.mechanism.synthetic } : undefined,
      stacktrace: value.stacktrace ? { frames: value.stacktrace.frames?.map(frame => ({
        function: frame.function, module: frame.module, lineno: frame.lineno,
        colno: frame.colno, in_app: frame.in_app,
        filename: frame.filename && /^(?:https?:\/\/|\/)/.test(frame.filename) ? telemetryUrl(frame.filename) : frame.filename,
        abs_path: frame.abs_path ? telemetryUrl(frame.abs_path) : undefined,
      })) } : undefined,
    })) } : undefined,
  };
}

/** Replay's custom breadcrumbs/spans follow the same policy; DOM masking stays on. */
export function sanitizeReplayFrame<T extends { data: { tag: string; payload: unknown } }>(frame: T): T | null {
  const payload = frame.data.payload;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  if (frame.data.tag === "breadcrumb") {
    const crumb = sanitizeBreadcrumb(payload as Breadcrumb);
    return crumb ? { ...frame, data: { ...frame.data, payload: crumb } } : null;
  }
  if (frame.data.tag === "performanceSpan") {
    const span = payload as Record<string, unknown>;
    return { ...frame, data: { ...frame.data, payload: { op: span.op, startTimestamp: span.startTimestamp,
      endTimestamp: span.endTimestamp, description: "CRM operation", data: safeData(span.data as Record<string, unknown> | undefined) } } };
  }
  if (frame.data.tag === "options") return frame; // SDK-generated boolean/numeric privacy settings only.
  return null;
}
