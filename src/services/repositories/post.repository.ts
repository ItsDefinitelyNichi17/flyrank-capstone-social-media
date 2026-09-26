import pool from "../../db/app.js"
import TurndownService from 'turndown'

var turndownService = new TurndownService() // this service turns raw html as a markdown https://www.npmjs.com/package/turndown

export async function getPostsQuery() {
  const q = await pool.query(`SELECT * FROM posts`)
  return q.rows
}

export async function storePostQuery(content: string, type: string) {
  const id = crypto.randomUUID()
  content = content.trim()
  const markdown = turndownService.turndown(content)
  const q = await pool.query(
    `INSERT INTO posts(id,
      source_type,
      post_content)
    VALUES($1, $2, $3 )
    RETURNING *`, [id, type, markdown])
  return q
}
