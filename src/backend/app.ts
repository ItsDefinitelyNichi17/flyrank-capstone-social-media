import 'dotenv/config';
import express from 'express'
import IngestRoute from './routes/ingest.route'

console.log(process.env.PORT)

const app = express();
const port = process.env.PORT ?? 3000
app.use(express.json());

app.use('/ingest', IngestRoute);
app.listen(port, () => {
  console.log("app listens in port " + port)
})
