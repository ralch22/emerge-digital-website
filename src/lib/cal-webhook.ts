// Types + pure helpers for the Cal.com webhook → Salesforce Milestone__c integration
// (customer-onboarding blueprint §9.3.1). Kept framework-free so the Worker handler in
// worker.ts stays thin and mirrors the existing /api/contact + /api/subscribe style.
//
// Flow:  Cal.com (BOOKING_*) ──webhook──▶ /api/cal-webhook ──Salesforce REST──▶ Milestone__c
//        (upsert by the Cal_Booking_UID__c external id, so reschedules update the same row).

export type CalTriggerEvent =
  | 'BOOKING_CREATED'
  | 'BOOKING_RESCHEDULED'
  | 'BOOKING_CANCELLED';

export interface CalAttendee {
  email?: string;
  name?: string;
}

/** The subset of the Cal.com booking payload we read. Cal.com sends many more fields. */
export interface CalBookingPayload {
  uid?: string;
  title?: string;
  startTime?: string;
  endTime?: string;
  attendees?: CalAttendee[];
  location?: string;
  videoCallData?: { url?: string };
  metadata?: Record<string, string | undefined>;
}

export interface CalWebhookBody {
  triggerEvent?: string;
  payload?: CalBookingPayload;
}

export type MilestoneStatus = 'Scheduled' | 'Rescheduled' | 'Canceled';

/** Milestone__c fields written on upsert. Cal_Booking_UID__c is the external id and
 *  travels in the PATCH URL, so it is intentionally NOT part of the request body. */
export interface MilestoneUpsertBody {
  Scheduled_Start__c?: string;
  Scheduled_End__c?: string;
  Attendee_Email__c?: string;
  Meeting_URL__c?: string;
  Status__c: MilestoneStatus;
  Engagement__c?: string;
}

const STATUS_BY_EVENT: Record<CalTriggerEvent, MilestoneStatus> = {
  BOOKING_CREATED: 'Scheduled',
  BOOKING_RESCHEDULED: 'Rescheduled',
  BOOKING_CANCELLED: 'Canceled',
};

export function isSupportedTrigger(evt: string | undefined): evt is CalTriggerEvent {
  return (
    evt === 'BOOKING_CREATED' ||
    evt === 'BOOKING_RESCHEDULED' ||
    evt === 'BOOKING_CANCELLED'
  );
}

export function statusForTrigger(evt: CalTriggerEvent): MilestoneStatus {
  return STATUS_BY_EVENT[evt];
}

/** First attendee email (the booker), used to resolve the Engagement__c. */
export function firstAttendeeEmail(payload: CalBookingPayload): string | undefined {
  const email = payload.attendees?.find((a) => a.email)?.email;
  return email?.trim() || undefined;
}

/** Meeting/video-call link, trying the common Cal.com locations in order. */
export function meetingUrl(payload: CalBookingPayload): string | undefined {
  return (
    payload.videoCallData?.url?.trim() ||
    payload.metadata?.videoCallUrl?.trim() ||
    payload.location?.trim() ||
    undefined
  );
}

/** An Engagement__c id passed directly in booking metadata, if present. */
export function engagementIdFromMetadata(payload: CalBookingPayload): string | undefined {
  const m = payload.metadata ?? {};
  return (m.engagementId || m.engagement_id || m.Engagement__c)?.toString().trim() || undefined;
}

/** Build the Milestone__c field map for the REST upsert (excludes the external id). */
export function buildUpsertBody(args: {
  payload: CalBookingPayload;
  status: MilestoneStatus;
  engagementId?: string;
}): MilestoneUpsertBody {
  const { payload, status, engagementId } = args;
  const body: MilestoneUpsertBody = { Status__c: status };
  if (payload.startTime) body.Scheduled_Start__c = payload.startTime;
  if (payload.endTime) body.Scheduled_End__c = payload.endTime;
  const email = firstAttendeeEmail(payload);
  if (email) body.Attendee_Email__c = email;
  const url = meetingUrl(payload);
  if (url) body.Meeting_URL__c = url;
  if (engagementId) body.Engagement__c = engagementId;
  return body;
}

/** Escape a value for safe interpolation into a SOQL string literal. */
export function soqlEscape(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/**
 * Verify the Cal.com `X-Cal-Signature-256` header: a hex-encoded HMAC-SHA256 of the
 * raw request body, keyed by the shared signing secret. Constant-time comparison.
 */
export async function verifyCalSignature(
  rawBody: string,
  signature: string | null,
  secret: string,
): Promise<boolean> {
  if (!signature || !secret) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
  const expected = [...new Uint8Array(sigBuf)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return timingSafeEqualHex(expected, signature.trim().toLowerCase());
}

/** Length-checked, constant-time hex string comparison. */
function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}
