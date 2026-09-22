import { Job, Worker } from 'bullmq';
import { updateVariantState } from '../repositories/schedule_slots.repository.js';
import { publisherManager } from '../publisher/publisher.js';
import fs from 'fs';
import path from 'path';

interface PublishedVariant {
  variant_id: string;
  slot_id?: string;
  sched_id?: string;
  variant_content: string;
  platformName: string;
}

export async function processVariantJob(data: PublishedVariant) {
  const platformName = data.platformName;
  const variantId = data.variant_id;
  const slotId = data.slot_id || data.sched_id;

  const publishManager = publisherManager(platformName);
  if (!publishManager) {
    throw new Error(`Failed to Publish: No publisher found for platform: ${platformName}`);
  }

  const publish = await publishManager.publish({
    variantId ,
    slotId,
    content: data.variant_content,
  });

  if (!publish.success) {
    if (publish.alreadyPublished || publish.errorMessage === 'Attempt already successful') {
      console.log(`Variant ${variantId} (slot: ${slotId}) was already published. Skipping duplicate post.`);
      return { skipped: true, alreadyPublished: true };
    }
    await updateVariantState(variantId, "failed", publish.errorMessage);
    throw new Error(publish.errorMessage);
  }

  await updateVariantState(variantId, "published");
  console.log(`Successfully published variant ${variantId} for slot ${slotId}`);
  return { success: true };
}


const worker = new Worker(
  'variantQueue',
  async (job: Job<PublishedVariant>) => {
    try {
      await processVariantJob(job.data);

    } catch (e) {
      if (e instanceof Error) {
        console.error(`Worker error for variant ${job.data.variant_id}: ${e.message}`);
      }
      throw e;
    }
  },
  { connection: { host: process.env.REDIS_HOST, port: Number(process.env.REDIS_PORT) || 6379 } }
);

export default worker;
