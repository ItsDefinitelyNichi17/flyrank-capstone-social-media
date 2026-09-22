import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import pool from '../../db/app.js';
import { MockPublisher } from './publisher.js';
import {
  insertScheduleVariant,
  getSlotByVariantOrId,
  isSlotPublished,
} from '../repositories/schedule_slots.repository.js';

// Helper to create a test post and variant in PostgreSQL
async function createTestFixture(platform: 'x' | 'discord' | 'linkedin' = 'x') {
  // 1. Insert post
  const postRes = await pool.query(
    `INSERT INTO posts (source_type, post_content)
     VALUES ('markdown', 'Idempotent publish test post')
     RETURNING id`
  );
  const postId = postRes.rows[0].id;

  // 2. Insert variant
  const variantRes = await pool.query(
    `INSERT INTO variants (post_id, platform, status, variant_content)
     VALUES ($1, $2, 'approved', 'Content for idempotent test')
     RETURNING id`,
    [postId, platform]
  );
  const variantId = variantRes.rows[0].id;

  return { postId, variantId };
}

describe('Idempotent Publish - schedule_slots schema only', () => {
  before(async () => {
    // Verify connection to maindb
    const res = await pool.query('SELECT current_database(), current_user;');
    console.log(`Connected to DB: ${res.rows[0].current_database} as ${res.rows[0].current_user}`);
  });

  after(async () => {
    // Close pool cleanly after test run
    await pool.end();
  });

  it('proves the same variant and slot never post two times across sequential retries', async () => {
    const { variantId } = await createTestFixture('x');
    const scheduledAt = new Date(Date.now() + 60000);
    const slot = await insertScheduleVariant(variantId, scheduledAt);

    const publisher = new MockPublisher('x');
    assert.equal(publisher.postCount, 0, 'Initial post count should be 0');

    // Attempt 1: Initial publish attempt
    const result1 = await publisher.publish({
      variantId,
      slotId: slot.id,
      content: 'Hello World Post 1',
    });

    assert.equal(result1.success, true, 'First publish attempt should succeed');
    assert.equal(publisher.postCount, 1, 'First attempt should execute the post exactly once');

    // Verify schedule_slots schema state
    const slotAfterAttempt1 = await getSlotByVariantOrId(variantId, slot.id);
    assert.equal(slotAfterAttempt1?.state, 'published', 'Slot state must be published in schedule_slots');

    const publishedStatus = await isSlotPublished(variantId, slot.id);
    assert.equal(publishedStatus, true, 'isSlotPublished should report true');

    // Attempt 2 (Retry 1): Worker/Queue retries the exact same variant and slot
    const result2 = await publisher.publish({
      variantId,
      slotId: slot.id,
      content: 'Hello World Post 1',
    });

    assert.equal(result2.alreadyPublished, true, 'Retry 1 should detect slot is already published');
    assert.equal(publisher.postCount, 1, 'Retry 1 MUST NOT post a second time! Count remains 1');

    // Attempt 3 (Retry 2): Another retry
    const result3 = await publisher.publish({
      variantId,
      slotId: slot.id,
      content: 'Hello World Post 1',
    });

    assert.equal(result3.alreadyPublished, true, 'Retry 2 should detect slot is already published');
    assert.equal(publisher.postCount, 1, 'Retry 2 MUST NOT post a second time! Count remains 1');

    // Final database check
    const finalSlot = await getSlotByVariantOrId(variantId, slot.id);
    assert.equal(finalSlot?.state, 'published', 'State remains published in schedule_slots');
  });

  it('proves concurrent publish attempts for the same variant and slot execute only once (no race condition double-post)', async () => {
    const { variantId } = await createTestFixture('linkedin');
    const scheduledAt = new Date(Date.now() + 60000);
    const slot = await insertScheduleVariant(variantId, scheduledAt);

    const publisher = new MockPublisher('linkedin');
    assert.equal(publisher.postCount, 0);

    // Trigger 10 concurrent publish attempts simultaneously for the SAME variant and slot
    const concurrentAttempts = 10;
    const promises = Array.from({ length: concurrentAttempts }, () =>
      publisher.publish({
        variantId,
        slotId: slot.id,
        content: 'Concurrent test content',
      })
    );

    const results = await Promise.all(promises);

    // Exactly 1 must have performed the initial publish, all 9 others must be marked already published
    const successfulPosts = results.filter((r) => r.success && !r.alreadyPublished);
    const alreadyPublishedCalls = results.filter((r) => r.alreadyPublished);

    assert.equal(successfulPosts.length, 1, 'Exactly one concurrent attempt must perform the post');
    assert.equal(alreadyPublishedCalls.length, concurrentAttempts - 1, 'All other attempts must be blocked from posting');
    assert.equal(publisher.postCount, 1, 'Under 10 concurrent requests, MockPublisher posted EXACTLY ONCE');

    const slotState = await getSlotByVariantOrId(variantId, slot.id);
    assert.equal(slotState?.state, 'published', 'Slot state must be published in schedule_slots');
  });

  it('proves retry succeeds after a transient failure and never posts again once published', async () => {
    const { variantId } = await createTestFixture('x');
    const scheduledAt = new Date(Date.now() + 60000);
    const slot = await insertScheduleVariant(variantId, scheduledAt);

    const publisher = new MockPublisher('x');
    // Simulate transient failure on first attempt
    publisher.failNextAttempt = true;

    // Attempt 1: Fails
    const result1 = await publisher.publish({
      variantId,
      slotId: slot.id,
      content: 'Retry after failure test',
    });

    assert.equal(result1.success, false, 'First attempt failed as expected');
    assert.equal(publisher.postCount, 0, 'No post should have succeeded');

    const failedSlot = await getSlotByVariantOrId(variantId, slot.id);
    assert.equal(failedSlot?.state, 'failed', 'Slot state must be recorded as failed in schedule_slots');
    assert.ok(failedSlot?.last_error?.includes('Transient failure'), 'Error message should be recorded in last_error');

    // Attempt 2 (Retry after failure): Succeeds
    const result2 = await publisher.publish({
      variantId,
      slotId: slot.id,
      content: 'Retry after failure test',
    });

    assert.equal(result2.success, true, 'Retry attempt should succeed');
    assert.equal(publisher.postCount, 1, 'Post count should now be 1');

    const publishedSlot = await getSlotByVariantOrId(variantId, slot.id);
    assert.equal(publishedSlot?.state, 'published', 'Slot state transitioned to published in schedule_slots');

    // Attempt 3 (Retry after success): Idempotent no-op
    const result3 = await publisher.publish({
      variantId,
      slotId: slot.id,
      content: 'Retry after failure test',
    });

    assert.equal(result3.alreadyPublished, true, 'Subsequent retry detects slot is already published');
    assert.equal(publisher.postCount, 1, 'Must NOT post again! Post count remains 1');
  });

  it('verifies idempotency is enforced strictly under schedule_slots schema without creating any new table', async () => {
    // Check tables in postgres
    const { rows } = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    const tableNames = rows.map((r) => r.table_name);
    console.log('Tables in public schema:', tableNames);

    // Verify schedule_slots exists and contains the expected columns
    const { rows: columns } = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'schedule_slots'
      ORDER BY ordinal_position;
    `);
    const colNames = columns.map((c) => c.column_name);
    console.log('Columns in schedule_slots:', colNames);

    assert.ok(colNames.includes('id'), 'schedule_slots must have id column');
    assert.ok(colNames.includes('variant_id'), 'schedule_slots must have variant_id column');
    assert.ok(colNames.includes('state'), 'schedule_slots must have state column');
    assert.ok(colNames.includes('scheduled_at'), 'schedule_slots must have scheduled_at column');

    // Verify NO new table was created for idempotency (e.g. no idempotency_keys or publish_attempts)
    assert.ok(!tableNames.includes('idempotency_keys'), 'No idempotency_keys table should exist');
    assert.ok(!tableNames.includes('publish_attempts'), 'No publish_attempts table should exist');
  });
});
