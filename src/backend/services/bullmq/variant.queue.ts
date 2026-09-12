import { Queue } from 'bullmq';

export const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
};

const variantQueue = new Queue(
  'variantQueue',
  { connection: redisConnection }
);

export async function scheduleJob(ms: number, variantId: string, slotId: string) {
  await variantQueue.add("publish-variant", { variant_id: variantId, slot_id: slotId }, { delay: ms })
}
