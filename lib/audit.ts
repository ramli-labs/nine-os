import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Writes an audit trail entry for a teacher action. Fire-and-forget:
 * audit failure must never block the action itself (it is logged to
 * the server console instead). RLS ensures only a teacher session can
 * insert, and always as themselves (actor_id = auth.uid()).
 */
export async function logAudit(
  supabase: SupabaseClient,
  actorId: string,
  action: string,
  targetType: string,
  targetId?: string | null,
  metadata?: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase.from("audit_logs").insert({
    actor_id: actorId,
    action,
    target_type: targetType,
    target_id: targetId ?? null,
    metadata: metadata ?? null,
  });
  if (error) {
    console.error(`audit log failed (${action}):`, error.message);
  }
}
