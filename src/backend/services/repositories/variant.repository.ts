import pool from "../../db/app.js"

export interface VariantQuery {
  post_id: string
  hashtags: string[]
  variant_content: string
  platform: string
}

export const VALID_VARIANT_STATUSES = ["draft", "approved", "rejected"] as const;
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

export async function getVariants(id: string) {
  const q = await pool.query(`SELECT * FROM variants WHERE post_id = $1`, [id])
  return q.rows;
}

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
