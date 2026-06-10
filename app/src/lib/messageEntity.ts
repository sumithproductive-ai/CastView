export type MessageEntityKind = 'prospect' | 'model' | 'unknown';

export function resolveEntityKind(
  entityId: string,
  prospectIds: Iterable<string>,
  modelIds: Iterable<string>,
): MessageEntityKind {
  const prospects = new Set(prospectIds);
  const models = new Set(modelIds);
  if (prospects.has(entityId)) return 'prospect';
  if (models.has(entityId)) return 'model';
  return 'unknown';
}

export function messageTabPath(entityId: string, kind: MessageEntityKind): string {
  if (kind === 'model') return `/roster/${entityId}?tab=messages`;
  if (kind === 'prospect') return `/prospects/${entityId}?tab=messages`;
  return '/prospects';
}

export function entityProfilePath(entityId: string, kind: MessageEntityKind): string {
  if (kind === 'model') return `/roster/${entityId}`;
  if (kind === 'prospect') return `/prospects/${entityId}`;
  return '/prospects';
}

export function resolveMessageTabPath(
  entityId: string | null | undefined,
  prospectIds: Iterable<string>,
  modelIds: Iterable<string>,
): string {
  if (!entityId) return '/prospects';
  const kind = resolveEntityKind(entityId, prospectIds, modelIds);
  return messageTabPath(entityId, kind);
}

export function resolveEntityProfilePath(
  entityId: string | null | undefined,
  prospectIds: Iterable<string>,
  modelIds: Iterable<string>,
): string {
  if (!entityId) return '/prospects';
  const kind = resolveEntityKind(entityId, prospectIds, modelIds);
  return entityProfilePath(entityId, kind);
}

export function messagePreviewText(
  message: { body?: string | null; subject?: string | null },
  maxLength = 80,
): string {
  const body = message.body?.trim();
  if (body) {
    if (body.length <= maxLength) return body;
    return `${body.slice(0, maxLength)}...`;
  }
  const subject = message.subject?.trim();
  if (subject) return subject;
  return 'Message';
}

export function normalizeMessageRow<T extends Record<string, unknown>>(row: T): T & { body: string } {
  const body = typeof row.body === 'string' ? row.body.trim() : '';
  return {
    ...row,
    body,
  };
}
