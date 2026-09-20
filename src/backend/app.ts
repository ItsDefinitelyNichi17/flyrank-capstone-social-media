import 'dotenv/config';
import express from 'express'
import IngestRoute from './routes/post.route.js'
import ArticleRoute from './routes/article.route.js'
import VariantRoutes from './routes/variant.route.js'
import worker from './services/bullmq/variant.worker.js';

const app = express();
const port = process.env.PORT ?? 3000
app.use(express.json());
worker.on('completed', (job) => {
  console.log(`Job Completed`);
});

worker.on('failed', (job, err) => {
  console.error(`worker failed job: `, err);
});
app.use('/ingest', IngestRoute);
app.use('/articles', ArticleRoute);
app.use('/variant', VariantRoutes);
app.listen(port, () => {
  console.log("app listens in port " + port);
})
