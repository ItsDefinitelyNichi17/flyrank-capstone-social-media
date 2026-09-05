import 'dotenv/config';
import express from 'express'
import IngestRoute from './routes/ingest.route.js'
import ArticleRoute from './routes/article.route.js'
import VariantRoutes from './routes/variant.route.js'

const app = express();
const port = process.env.PORT ?? 3000
app.use(express.json());

app.use('/ingest', IngestRoute);
app.use('/articles', ArticleRoute);
app.use('/variants', VariantRoutes);
app.listen(port, () => {
  console.log("app listens in port " + port)
})
