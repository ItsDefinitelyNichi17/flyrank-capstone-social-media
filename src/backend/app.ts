import express from 'express'
import dotenv from 'dotenv'

dotenv.config({ path: "../.env" })

const app = express();
const port = process.env.DATABASE_URL ?? 3000

app.use(express.json());

app.listen(port, () => {
  console.log("app listens in port" + port)
})
