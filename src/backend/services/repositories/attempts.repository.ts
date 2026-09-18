import pool from "../../db/app.js"

export async function saveAttempt(variantId: string, attemptStatus: 'success' | 'failed') {
  const result = await pool.query(
    'INSERT INTO publish_attempts(variant_id, status) VALUES ($1, $2) RETURNING *',
    [variantId, attemptStatus]
  )
  console.log("saved attempt")
  return result.rows[0]
}

export async function checkAttempt(variantId: string) {
  const { rows } = await pool.query(
    'SELECT * FROM publish_attempts \
    WHERE variant_id = $1 AND status = \'success\' \
    RETURNING * ', [variantId])
  return rows[0].length !== 0
}
