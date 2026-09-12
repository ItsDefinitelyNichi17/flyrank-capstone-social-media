import { Worker } from 'bullmq';
import { redisConnection } from './variant.queue.js';

console.log("Worker is running...")
const variantQueue = new Worker(
  'variantQueue',
  async (job) => {
    console.log("hi", job.data)
  }, {
    connection: redisConnection,
  });

export {variantQueue};
