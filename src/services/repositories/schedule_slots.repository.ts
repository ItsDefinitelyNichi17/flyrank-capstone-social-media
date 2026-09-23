import pool from "../../db/app.js"

export interface VariantQuery {
  post_id: string
  hashtags: string[]
  variant_content: string
  platform: string
}

export interface VariantScheduleSlot {
  id: string;
  variant_id: string;
  scheduled_at: Date;
  state: 'scheduled' | 'published' | 'failed';
  last_error: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface PublishLockResult {
  success: boolean;
  errorMessage?: string;
  alreadyPublished?: boolean;
}

export async function isSlotPublished(variantId: string, slotId?: string): Promise<boolean> {
  const query = slotId
    ? `SELECT 1 FROM schedule_slots WHERE variant_id = $1 AND id = $2 AND state = 'published' LIMIT 1`
    : `SELECT 1 FROM schedule_slots WHERE variant_id = $1 AND state = 'published' LIMIT 1`;
  const params = slotId ? [variantId, slotId] : [variantId];
  const { rows } = await pool.query(query, params);
  return rows.length > 0;
}

export async function getSlotByVariantOrId(
  variantId: string,
  slotId?: string
): Promise<VariantScheduleSlot | undefined> {
  const query = slotId
    ? `SELECT * FROM schedule_slots WHERE variant_id = $1 AND id = $2 LIMIT 1`
    : `SELECT * FROM schedule_slots WHERE variant_id = $1 LIMIT 1`;
  const params = slotId ? [variantId, slotId] : [variantId];
  const { rows } = await pool.query(query, params);
  return rows[0] as VariantScheduleSlot | undefined;
}

/**
 * Idempotent publish with concurrency locking on schedule_slots.
 * The same variant and slot will never be posted twice, even under retries or concurrent worker runs.
 */
export async function publishSlotWithLock(
  variantId: string,
  slotId: string | undefined,
  publishFn: () => Promise<{ success: boolean; errorMessage?: string }>
): Promise<PublishLockResult> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Ensure slot exists in schedule_slots if not already inserted
    if (slotId) {
      await client.query(
        `INSERT INTO schedule_slots (id, variant_id, scheduled_at, state)
         VALUES ($1, $2, NOW(), 'scheduled')
         ON CONFLICT (variant_id) DO NOTHING`,
        [slotId, variantId]
      );
    } else {
      await client.query(
        `INSERT INTO schedule_slots (variant_id, scheduled_at, state)
         VALUES ($1, NOW(), 'scheduled')
         ON CONFLICT (variant_id) DO NOTHING`,
        [variantId]
      );
    }

    // Acquire row-level lock on the slot for this variant
    const query = slotId
      ? `SELECT id, variant_id, state FROM schedule_slots WHERE variant_id = $1 AND id = $2 FOR UPDATE`
      : `SELECT id, variant_id, state FROM schedule_slots WHERE variant_id = $1 FOR UPDATE`;
    const params = slotId ? [variantId, slotId] : [variantId];

    const { rows } = await client.query(query, params);

    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return {
        success: false,
        errorMessage: `Schedule slot not found for variant ${variantId}${slotId ? ` and slot ${slotId}` : ''}`,
      };
    }

    const slot = rows[0];

    // Idempotency check: If already published, NEVER post again!
    if (slot.state === 'published') {
      await client.query('COMMIT');
      return {
        success: false,
        errorMessage: 'Attempt already successful',
        alreadyPublished: true,
      };
    }

    // Execute the external publish call while holding the row lock
    let publishRes: { success: boolean; errorMessage?: string };
    try {
      publishRes = await publishFn();
    } catch (err: any) {
      const errMsg = err instanceof Error ? err.message : String(err);
      await client.query(
        `UPDATE schedule_slots
         SET state = 'failed', last_error = $2, updated_at = NOW()
         WHERE id = $1`,
        [slot.id, errMsg]
      );
      await client.query('COMMIT');
      return { success: false, errorMessage: errMsg };
    }

    if (publishRes.success) {
      await client.query(
        `UPDATE schedule_slots
         SET state = 'published', last_error = NULL, updated_at = NOW()
         WHERE id = $1`,
        [slot.id]
      );

      // Also mark the variant status as published
      await client.query(
        `UPDATE variants
         SET status = 'published', updated_at = NOW()
         WHERE id = $1`,
        [variantId]
      );

      await client.query('COMMIT');
      return { success: true };
    } else {
      await client.query(
        `UPDATE schedule_slots
         SET state = 'failed', last_error = $2, updated_at = NOW()
         WHERE id = $1`,
        [slot.id, publishRes.errorMessage || 'Publish failed']
      );
      await client.query('COMMIT');
      if (!publishRes.errorMessage) {
        return { success: false };
      }
      return { success: false, errorMessage: publishRes.errorMessage };
    }
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function updateVariantState(
  variantId: string,
  state: string,
  lastError: string | null = null
) {
  let normalizedState = state;
  if (state === 'complete') normalizedState = 'published';
  if (state === 'queue') normalizedState = 'scheduled';

  const q = await pool.query(
    `UPDATE schedule_slots
     SET state = $2::slotstate,
         last_error = $3,
         updated_at = NOW()
     WHERE variant_id = $1
       AND (schedule_slots.state != 'published' OR $2::slotstate = 'published')
     RETURNING *`,
    [variantId, normalizedState, lastError]
  );
  return q.rows[0];
}

export async function checkScheduledVariants() {
  const q = await pool.query(`
    SELECT
      schedule_slots.id AS slot_id,
      schedule_slots.scheduled_at,
      variants.id AS variant_id,
      variants.platform,
      variants.variant_content
    FROM schedule_slots
    JOIN variants
      ON schedule_slots.variant_id = variants.id
    WHERE variants.status = 'approved'
      AND schedule_slots.scheduled_at <= NOW()
      AND schedule_slots.state != 'published'
      AND variants.status != 'published'
    FOR UPDATE OF schedule_slots SKIP LOCKED;`);
  return q.rows;
}

// Schedule the variant 1 variant 1 schedule slot. If the slot already exists, update it.
export async function insertScheduleVariant(
  variantId: string,
  scheduled_at: Date
): Promise<VariantScheduleSlot> {
  const q = await pool.query(
    `INSERT INTO schedule_slots (variant_id, scheduled_at, state)
     VALUES ($1, $2, 'scheduled')
     ON CONFLICT (variant_id)
     DO UPDATE SET
       scheduled_at = EXCLUDED.scheduled_at,
       state = CASE
         WHEN schedule_slots.state = 'published' THEN 'published'::slotstate
         ELSE 'scheduled'::slotstate
       END,
       updated_at = NOW()
     RETURNING *`,
    [variantId, scheduled_at]
  );
  return q.rows[0] as VariantScheduleSlot;
}

export async function getAllVariantScheduleSlots(): Promise<VariantScheduleSlot[]> {
  const q = await pool.query('SELECT * FROM schedule_slots');
  return q.rows as VariantScheduleSlot[];
}
