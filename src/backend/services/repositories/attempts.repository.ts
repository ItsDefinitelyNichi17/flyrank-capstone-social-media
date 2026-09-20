import pool from "../../db/app.js"
import { updateVariantState } from "./schedule_slots.repository.js";

export async function saveAttempt(variantId: string, attemptStatus: 'success' | 'failed', errorMessage?: string) {
  const slotState = attemptStatus === 'success' ? 'published' : 'failed';
  return updateVariantState(variantId, slotState, errorMessage);
}

export async function checkAttempt(variantOrSlotId: string) {
  const { rows } = await pool.query(
    `SELECT 1 FROM schedule_slots
     WHERE (variant_id = $1 OR id = $1) AND state = 'published'
     LIMIT 1`,
    [variantOrSlotId]
  );
  return rows.length > 0;
}

