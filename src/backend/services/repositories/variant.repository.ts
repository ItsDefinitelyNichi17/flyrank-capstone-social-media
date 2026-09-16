import pool from "../../db/app.js"

export interface VariantQuery {
  post_id: string
  hashtags: string[]
  variant_content: string
  platform: string
}

export const VALID_VARIANT_STATUSES = ["draft", "approved", "rejected", "published"] as const;
export type VariantStatus = (typeof VALID_VARIANT_STATUSES)[number];

export interface VariantRecord {
  id: string;
  post_id: string;
  status: VariantStatus;
  hashtags: string | null;
  platform: string;
  variant_content: string;
  created_at: Date;
  updated_at: Date;
}

/* Stores a variant in the database*/
export async function storeVariant(post_id: string[], hashtags: string[][], variant_content: string[], platform: string[]) {
  const formattedHashtags = hashtags.map((tags) => tags.join(','));
  console.log(post_id, variant_content, formattedHashtags, platform)
  const q = await pool.query(
    `INSERT INTO variants(post_id, hashtags, variant_content, platform) \
    SELECT * FROM UNNEST(
    $1::uuid[], $2::text[], $3::text[], $4::platform[])`,
    [post_id, formattedHashtags, variant_content, platform],
  )
}

// Updates the review status of the variant
export async function setVariantStatus(id: string, status: VariantStatus, post_id?: string) {
  if (post_id) {
    const q = await pool.query(
      `UPDATE variants
       SET status = $1, updated_at = NOW()
       WHERE id = $2 AND post_id = $3
       RETURNING *`,
      [status, id, post_id]
    );
    return (q.rows[0] as VariantRecord | undefined) ?? null;
  }

  const q = await pool.query(
    `UPDATE variants
     SET status = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [status, id]
  );
  return (q.rows[0] as VariantRecord | undefined) ?? null;
}

export async function checkScheduledVariants() {
  const q = await pool.query(`
    SELECT
      schedule_slots.id AS slot_id,
      schedule_slots.scheduled_at,
      variants.id AS variant_id,
      variants.platform,
      variants.text
    FROM schedule_slots
    JOIN variants
      ON schedule_slots.variant_id = variants.id
    WHERE variants.status = 'approved'
      AND schedule_slots.scheduled_at <= NOW()
      AND variants.status != 'published'
    FOR UPDATE OF variants SKIP LOCKED;`);
  return q.rows;
}

// Schedule the variant 1 variant 1 schedule slot. If the slot already exists, update it.
export async function insertScheduleVariant(variantId: string, scheduled_at: Date) {
  try {
    const q = await pool.query(
      `INSERT INTO schedule_slots (variant_id, scheduled_at, state)
      VALUES ($1, $2, 'queue')
      ON CONFLICT (variant_id)
      DO UPDATE SET
        scheduled_at = EXCLUDED.scheduled_at,
        state = 'queue'
      -- WHERE schedule_slots.state != 'complete'
      RETURNING *`,
      [variantId, scheduled_at]
    );
    console.log(q.rows[0]);
    return q.rows[0]
  } catch (e){
    if (e instanceof Error) {
      console.log(e.message)
      throw e;
    }
  }

}

export async function updateVariantState(variantId: string, state: string) {
  try {
    console.log("variantId: ", variantId, "state: ", state)
    const q = await pool.query(
      `UPDATE schedule_slots
      SET state = $2
      WHERE variant_id = $1
      RETURNING *`,
      [variantId, state]
    )
    return q.rows[0]
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message)
      throw error
    }
  }

}

// get specifc variant by the id
export async function getVariant(id: string): Promise<VariantRecord | undefined> {
  const q = await pool.query(`SELECT * FROM variants WHERE id = $1`, [id])
  return q.rows[0] as VariantRecord | undefined;
}

export async function getAllVariants(): Promise<VariantRecord[]> {
  const q = await pool.query(`SELECT * FROM variants`)
  return q.rows as VariantRecord[];
}
