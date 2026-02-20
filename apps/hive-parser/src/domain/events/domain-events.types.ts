/**
 * Typed payloads for in-process domain events (Nest EventEmitter).
 * Handlers should be idempotent where possible.
 */

export const DOMAIN_EVENTS = {
  OBJECT_CREATED: 'object.created',
  OBJECT_FIELD_UPDATED: 'object.field.updated',
  OBJECT_FIELD_VOTED: 'object.field.voted',
} as const;

export interface ObjectCreatedEventPayload {
  creator: string;
  author_permlink: string;
  importId?: string;
}

export interface ObjectFieldUpdatedEventPayload {
  objectPermlink: string;
  fieldTransactionId: string;
  fieldName: string;
  creator?: string;
  voter?: string;
  percent?: number;
}

export interface ObjectFieldVotedEventPayload {
  objectPermlink: string;
  fieldTransactionId: string;
  voter: string;
  percent: number;
}
