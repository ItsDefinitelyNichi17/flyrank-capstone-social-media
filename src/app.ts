import 'dotenv/config';
import express from 'express';
import IngestRoute from './routes/post.route.js';
import ArticleRoute from './routes/article.route.js';
import VariantRoutes from './routes/variant.route.js';
import worker from './services/bullmq/variant.worker.js';
import fs from 'fs';
import path from 'path';

const app = express();
const port = process.env.PORT ?? 3000
app.use(express.json());

worker.on('completed', (job) => {
  const logPath = path.join(import.meta.dirname, "logs", "worker.log.txt");
  const { variant_id, slot_id, sched_id, variant_content } = job.data;
  const logFormat = {
    data: {
      variant_id,
      slot_id,
      sched_id,
      variant_content,
    },
    success: true,
    date: new Date().toISOString()
  }
  fs.appendFileSync(logPath, JSON.stringify(logFormat, null, 2));
});
worker.on('failed', (job, err) => {
  const logPath = path.join(import.meta.dirname, "logs", "worker.log.txt");
  if(!job) return;
  const { slot_id, sched_id } = job.data;
  const logFormat = {
    data: {
      slot_id: slot_id,
      sched_id: sched_id,
    },
    success: false,
    error: err.message,
    date: new Date().toISOString()
  }
  fs.appendFileSync(logPath, JSON.stringify(logFormat, null, 2));
  console.log(job, err);
});
app.use('/post', IngestRoute);
app.use('/articles', ArticleRoute);
app.use('/variant', VariantRoutes);
app.listen(port, () => {
  console.log("app listens in port " + port);
})
