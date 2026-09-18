import { Job, Worker } from 'bullmq';
import { redisConnection } from './variant.queue.js';
import { updateVariantState } from '../repositories/variant.repository.js';
import { publisherManager } from '../publisher/publisher.js';

interface PublishedVariant {
  variant_id: string;
  slot_id: string;
  variant_content: string;
  platformName: string;
}

const worker = new Worker(
  'variantQueue',
  async (job: Job<PublishedVariant>) => {
    const platformName = job.data.platformName;
    try {
      const publishManager = publisherManager(platformName)
      if (!publishManager) {
        throw new Error(`No publisher found for platform: ${platformName}`)
      }
      await publishManager.publish({ variantId: job.data.variant_id, content: job.data.variant_content })
      const q = await updateVariantState(job.data.variant_id, "complete");
      console.log("published")
    } catch (e) {
      if (e instanceof Error) {
        console.error(e.message)
        throw e
      }
      return;
    }
  },
  { connection: redisConnection, }
);

export default worker;
