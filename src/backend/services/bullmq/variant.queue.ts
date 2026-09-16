import { Queue } from 'bullmq';

export const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
};

const variantQueue = new Queue(
  'variantQueue',
  { connection: redisConnection }
);

export async function scheduleJob(ms: number, variantId: string, slotId: string, variant_content: string) {
  try {
    const queue = await variantQueue.add("publish-variant",
      { variant_id: variantId, slot_id: slotId, variant_content },
      { delay: ms, removeOnComplete: true, removeOnFail: { count: 20 } })
    console.log('Job added to queue')
  } catch (e) {
    if (e instanceof Error) {
      console.log(e.message)
      throw e
    }
  }

}
