import { Queue } from 'bullmq';

const variantQueue = new Queue(
  'variantQueue',
  { connection: { host: process.env.REDIS_HOST, port: Number(process.env.REDIS_PORT) || 6379 } }
);

export async function scheduleJob(
  ms: number,
  variantId: string,
  schedId: string,
  variant_content: string,
  platformName: string,
) {
  try {
    const queue = await variantQueue.add(
      "publish-variant",
      {
        variant_id: variantId,
        slot_id: schedId,
        sched_id: schedId,
        variant_content,
        platformName: platformName,
      },
      {
        jobId: `publish-${variantId}-${schedId}`,
        delay: ms,
        removeOnComplete: true,
        removeOnFail: { count: 20 },
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      }
    );
    return queue;
  } catch (e) {
    if (e instanceof Error) {
      console.log(e.message);
      throw e;
    }
  }
}
