import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readTokenClaims } from '../src/lib/tokenClaims.ts';
import { isSensitiveTelemetryPath, telemetryUrl, sanitizeBreadcrumb,
  sanitizeTelemetryEvent, sanitizeTelemetrySpan, sanitizeReplayFrame } from '../src/lib/telemetryPrivacy.ts';

const claims = { email: 'a?@example.test', sub: 42, roles: ['admin'], exp: 2000000000, tenant_id: 7 };
const token = payload => `header.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`;

test('JWT claims accept unpadded base64url, UTF-8 and numeric string subjects', () => {
  assert.match(token(claims).split('.')[1], /[-_]/);
  assert.deepEqual(readTokenClaims(token(claims)), claims);
  assert.deepEqual(readTokenClaims(token({ ...claims, sub: '42', email: 'José@example.test' })),
    { ...claims, email: 'José@example.test' });
});

test('malformed tokens fail closed without including credentials in errors', () => {
  for (const invalid of ['secret', 'a.%%%.b', 'a._w.b', 'a.e30.b', 'a.bnVsbA.b',
    token({ ...claims, sub: 'not-an-id' }), token({ ...claims, roles: 'admin' }),
    token({ ...claims, exp: '2000000000' }), token({ ...claims, email: null })]) {
    assert.throws(() => readTokenClaims(invalid), error => !error.message.includes(invalid));
  }
});

test('diagnostic URLs omit credentials, query, fragments, reset tokens and record IDs', () => {
  assert.equal(telemetryUrl('https://owner:password@api.example.test/api/clients/42?q=PRIVATE#PRIVATE'),
    'https://api.example.test/api/clients/[id]');
  assert.equal(telemetryUrl('/%72eset-password/PRIVATE?email=PRIVATE'), '/reset-password/[redacted]');
  assert.equal(telemetryUrl('/reset-password/PRIVATE'), '/reset-password/[redacted]');
  assert.equal(telemetryUrl('/api/reset-password/PRIVATE%2FPRIVATE'), '/api/reset-password/[redacted]');
  assert.equal(telemetryUrl('data:PRIVATE'), '[redacted-url]');
  assert.equal(telemetryUrl('/%ZZ'), '[redacted-url]');
  assert.equal(isSensitiveTelemetryPath('/%72eset-password/PRIVATE'), true);
  assert.equal(isSensitiveTelemetryPath('/reset-password'), true);
  assert.equal(isSensitiveTelemetryPath('/projects'), false);
});

test('Sentry error and transaction policies retain diagnostic structure without private CRM content', () => {
  const secret = 'PRIVATE_customer_email_token_body';
  const span = { trace_id: 'trace', span_id: 'span', op: 'http.client', start_timestamp: 1,
    description: `https://api.example.test/clients/42?q=${secret}`,
    data: { url: `/api/clients/42?q=${secret}`, method: 'post', status: 503, body: secret } };
  const event = { event_id: 'event', level: 'error', message: secret, fingerprint: [secret],
    logentry: { message: secret, params: [secret] }, user: { email: secret }, tags: { email: secret },
    extra: { url: `/api/search?q=${secret}`, status: 503, method: 'GET', customer: secret },
    request: { url: `https://crm.example.test/reset-password/${secret}`, data: secret,
      headers: { Authorization: secret }, cookies: secret, method: 'GET' },
    transaction: `/projects?search=${secret}`,
    contexts: { customer: { email: secret }, trace: { trace_id: 'trace', span_id: 'span', op: 'navigation', data: { body: secret } } },
    breadcrumbs: [{ category: 'console', message: secret },
      { category: 'navigation', message: secret, data: { from: `/login?email=${secret}`, to: '/projects', email: secret } }],
    spans: [span], threads: { values: [{ name: secret }] },
    exception: { values: [{ type: 'TypeError', value: `Failed to fetch ${secret}`,
      mechanism: { type: 'generic', handled: true, data: { body: secret } },
      stacktrace: { frames: [{ filename: `https://crm.example.test/assets/app.js?${secret}`,
        function: 'loadProjects', lineno: 10, colno: 4, vars: { body: secret }, context_line: secret }] } }] } };
  const result = sanitizeTelemetryEvent(event);
  assert.ok(!JSON.stringify(result).includes(secret));
  assert.equal(result.level, 'warning');
  assert.equal(result.event_id, 'event');
  assert.equal(result.contexts.trace.trace_id, 'trace');
  assert.equal(result.exception.values[0].stacktrace.frames[0].lineno, 10);
  assert.equal(result.exception.values[0].type, 'TypeError');
  assert.equal(result.extra.status, 503);
  assert.equal(result.extra.method, 'GET');
  assert.equal(result.breadcrumbs.length, 1);
  assert.equal(sanitizeTelemetrySpan(span).data.method, 'POST');
  assert.equal(event.user.email, secret, 'sanitization must not mutate the caller');
});

test('replay custom events drop typed UI/console content and scrub network metadata', () => {
  assert.equal(sanitizeBreadcrumb({ category: 'ui.input', message: 'PRIVATE' }), null);
  assert.equal(sanitizeReplayFrame({ data: { tag: 'breadcrumb', payload: { category: 'console', message: 'PRIVATE' } } }), null);
  const frame = { type: 5, timestamp: 1, data: { tag: 'performanceSpan', payload: {
    op: 'resource.fetch', description: 'PRIVATE', startTimestamp: 1, endTimestamp: 2,
    data: { url: '/api/search?q=PRIVATE', status: 200, request: 'PRIVATE' } } } };
  const safe = sanitizeReplayFrame(frame);
  assert.ok(!JSON.stringify(safe).includes('PRIVATE'));
  assert.equal(safe.data.payload.data.status, 200);
  assert.equal(sanitizeReplayFrame({ data: { tag: 'unknown', payload: { body: 'PRIVATE' } } }), null);
});
