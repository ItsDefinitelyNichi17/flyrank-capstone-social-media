import { describe, expect, test } from '@jest/globals';

import { constraint, type platforms } from '../variant/variant.types.constraints.js';
import { validateVariant } from '../variant/variant.validator.js';

type MockVariant = {
  platform: platforms;
  content: string;
  hashtags: string[];
  tone: string;
};

const expectedTones: Record<platforms, string[]> = {
  linkedin: ['Professional', 'Authorative', 'Career Centric'],
  x: ['Opinioated', 'Punchy', 'Direct'],
  discord: ['Casual', 'Converasational', 'Community Driven'],
};

function mockVariant(platform: platforms): MockVariant {
  const rules = constraint[platform];

  return {
    platform,
    content: 'a'.repeat(rules.length_min),
    hashtags: Array.from({ length: rules.hashtag_min }, (_, index) => `tag${index + 1}`),
    tone: rules.tone[0]!,
  };
}

describe('variant platform constraints', () => {
  test.each(['linkedin', 'x', 'discord'] as const)(
    '%s applies its length, tone, and hashtag rules',
    (platform) => {
      const variant = mockVariant(platform);
      const rules = constraint[platform];

      expect(rules.tone).toEqual(expectedTones[platform]);
      expect(rules.tone).toContain(variant.tone);
      expect(variant.content).toHaveLength(rules.length_min);
      expect(variant.hashtags).toHaveLength(rules.hashtag_min);
      expect(validateVariant(platform, variant.hashtags.length, variant.content)).toBe(true);
    },
  );

  test('blocks a bad mock variant that does not meet X constraints', () => {
    const badVariant: MockVariant = {
      platform: 'x',
      content: 'Too short',
      hashtags: ['only-one-tag'],
      tone: 'Sarcastic',
    };

    expect(badVariant.content.length).toBeLessThan(constraint.x.length_min);
    expect(badVariant.hashtags.length).toBeLessThan(constraint.x.hashtag_min);
    expect(constraint.x.tone).not.toContain(badVariant.tone);
    expect(validateVariant(
      badVariant.platform,
      badVariant.hashtags.length,
      badVariant.content,
    )).toBe(false);
  });
});
