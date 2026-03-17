interface AuditEvent {
  action: string;
  userId?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}

export function auditLog(event: AuditEvent): void {
  console.log(
    JSON.stringify({
      type: 'AUDIT',
      timestamp: new Date().toISOString(),
      ...event,
    })
  );
}
