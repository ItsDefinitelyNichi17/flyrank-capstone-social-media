import express from 'express'
import dotenv from 'dotenv'
import IngestRoute from './routes/ingest.route'
dotenv.config({ path: "../.env" })

const app = express();
const port = process.env.DATABASE_URL ?? 3000
console.log(process.env.DATABASE_URL)
app.use(express.json());

app.use('/ingest', IngestRoute);
app.listen(port, () => {
  console.log("app listens in port " + port)
})
