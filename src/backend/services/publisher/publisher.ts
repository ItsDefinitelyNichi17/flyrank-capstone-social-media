import { publishSlotWithLock } from "../repositories/schedule_slots.repository.js";
import type { ISocialPublisher, PublishPayload, PublishResult } from "./publisher.interface.js";
import dotenv from 'dotenv';

dotenv.config();

export class DiscordPublisher implements ISocialPublisher {
  readonly platformName = "Discord";
  public postCount = 0;

  async publish(payload: PublishPayload): Promise<PublishResult> {
    if (!payload.variantId) {
      return { success: false, errorMessage: 'variantId is required' };
    }
    return publishSlotWithLock(payload.variantId, payload.slotId, async () => {
      console.log('Publishing to Discord');
      const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
      if (!webhookUrl) {
        throw new Error("DISCORD_WEBHOOK_URL is not defined in environment");
      }

      const publishResult = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: payload.content }),
      });

      if (!publishResult.ok) {
        const errorText = await publishResult.text().catch(() => publishResult.statusText);
        return { success: false, errorMessage: `Discord error (${publishResult.status}): ${errorText}` };
      }

      this.postCount++;
      console.log('Published to Discord');
      return { success: true };
    });
  }
}

export class MockPublisher implements ISocialPublisher {
  readonly platformName: string;
  public postCount = 0;
  public failNextAttempt = false;

  constructor(platformName: string) {
    this.platformName = platformName;
  }

  async publish(payload: PublishPayload): Promise<PublishResult> {
    if (!payload.variantId) {
      return { success: false, errorMessage: 'variantId is required' };
    }
    return publishSlotWithLock(payload.variantId, payload.slotId, async () => {
      if (this.failNextAttempt) {
        this.failNextAttempt = false;
        return { success: false, errorMessage: `Transient failure on ${this.platformName}` };
      }
      console.log("Publishing to " + this.platformName);
      this.postCount++;
      console.log(`Published to ${this.platformName}`);
      return { success: true };
    });
  }
}

export function publisherManager(platformName: string): ISocialPublisher | undefined {
  const normalized = platformName.toLowerCase();
  if (normalized === "discord") {
    return new DiscordPublisher();
  } else if (normalized === "x" || normalized === "linkedin") {
    return new MockPublisher(platformName);
  }
  return new MockPublisher(platformName);
}
