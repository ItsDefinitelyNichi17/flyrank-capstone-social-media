import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';

const getVariant = jest.fn();
const insertScheduleVariant = jest.fn();
const scheduleJob = jest.fn();
const updateVariantState = jest.fn();
const publisherManager = jest.fn();

jest.unstable_mockModule('../repositories/variant.repository.js', () => ({
  getVariant,
  getAllVariants: jest.fn(),
  setVariantStatus: jest.fn(),
  VALID_VARIANT_STATUSES: ['draft', 'approved', 'rejected', 'published'],
}));

jest.unstable_mockModule('../repositories/schedule_slots.repository.js', () => ({
  insertScheduleVariant,
  getAllVariantScheduleSlots: jest.fn(),
  updateVariantState,
}));

jest.unstable_mockModule('../bullmq/variant.queue.js', () => ({ scheduleJob }));
jest.unstable_mockModule('../publisher/publisher.js', () => ({ publisherManager }));
jest.unstable_mockModule('bullmq', () => ({
  Job: class Job {},
  Worker: class Worker {
    constructor(..._args: unknown[]) {}
  },
}));

const { scheduleVariantController } = await import('../../controller/variant.controller.js');
const { processVariantJob } = await import('../bullmq/variant.worker.js');

function responseDouble() {
  const response = {
    status: jest.fn(),
    json: jest.fn(),
  };
  response.status.mockReturnValue(response);
  return response;
}

const approvedVariant = {
  id: 'variant-1',
  post_id: 'post-1',
  status: 'approved',
  hashtags: null,
  platform: 'discord',
  variant_content: 'A deterministic message',
  created_at: new Date('2024-01-01T00:00:00.000Z'),
  updated_at: new Date('2024-01-01T00:00:00.000Z'),
};

describe('scheduling and publishing boundaries', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-01T12:00:00.000Z'));
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('blocked variant: refuses scheduling a variant that has not been approved', async () => {
    getVariant.mockResolvedValue({ ...approvedVariant, status: 'rejected' });
    const response = responseDouble();

    await scheduleVariantController(
      { params: { variantId: 'variant-1' }, body: { schedule: '2025-01-01T12:05:00.000Z' } } as never,
      response as never,
    );

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({ message: 'Variant is not approved' });
    expect(insertScheduleVariant).not.toHaveBeenCalled();
    expect(scheduleJob).not.toHaveBeenCalled();
  });

  test('refused schedule: rejects a past time without inserting a slot or queueing work', async () => {
    getVariant.mockResolvedValue(approvedVariant);
    const response = responseDouble();

    await scheduleVariantController(
      { params: { variantId: 'variant-1' }, body: { schedule: '2025-01-01T11:59:59.000Z' } } as never,
      response as never,
    );

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({ message: 'Schedule time should be in the future' });
    expect(insertScheduleVariant).not.toHaveBeenCalled();
    expect(scheduleJob).not.toHaveBeenCalled();
  });

  test('duplicate publish: treats an already-published slot as a successful no-op', async () => {
    publisherManager.mockReturnValue({
      publish: jest.fn().mockResolvedValue({
        success: false,
        alreadyPublished: true,
        errorMessage: 'Attempt already successful',
      }),
    });

    await expect(processVariantJob({
      variant_id: 'variant-1',
      slot_id: 'slot-1',
      variant_content: 'A deterministic message',
      platformName: 'discord',
    })).resolves.toEqual({ skipped: true, alreadyPublished: true });

    expect(updateVariantState).not.toHaveBeenCalled();
  });

  test('adapter swap: chooses the adapter for each job platform and preserves its payload', async () => {
    const discordAdapter = { publish: jest.fn().mockResolvedValue({ success: true }) };
    const linkedinAdapter = { publish: jest.fn().mockResolvedValue({ success: true }) };
    publisherManager.mockReturnValueOnce(discordAdapter).mockReturnValueOnce(linkedinAdapter);

    await processVariantJob({
      variant_id: 'variant-1', slot_id: 'slot-1', variant_content: 'Discord copy', platformName: 'discord',
    });
    await processVariantJob({
      variant_id: 'variant-2', sched_id: 'slot-2', variant_content: 'LinkedIn copy', platformName: 'linkedin',
    });

    expect(publisherManager).toHaveBeenNthCalledWith(1, 'discord');
    expect(publisherManager).toHaveBeenNthCalledWith(2, 'linkedin');
    expect(discordAdapter.publish).toHaveBeenCalledWith({ variantId: 'variant-1', slotId: 'slot-1', content: 'Discord copy' });
    expect(linkedinAdapter.publish).toHaveBeenCalledWith({ variantId: 'variant-2', slotId: 'slot-2', content: 'LinkedIn copy' });
    expect(updateVariantState).toHaveBeenCalledWith('variant-1', 'published');
    expect(updateVariantState).toHaveBeenCalledWith('variant-2', 'published');
  });
});
