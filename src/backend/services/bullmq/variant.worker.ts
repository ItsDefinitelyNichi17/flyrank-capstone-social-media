import { Job, Worker } from 'bullmq';
import { redisConnection } from './variant.queue.js';
import { updateVariantState } from '../repositories/variant.repository.js';
import { DiscordPublisher } from '../publisher/publisher.js';

interface PublishedVariant {
  variant_id: string;
  slot_id: string;
  variant_content: string;
}

const variantQueue = new Worker(
  'variantQueue',
  async (job: Job<PublishedVariant>) => {
    console.log("publishing..")
    try {
      const publisher = new DiscordPublisher();
      await publisher.publish({ variantId: job.data.variant_id, content: job.data.variant_content })
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

export {variantQueue};
