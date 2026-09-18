import { checkAttempt, saveAttempt } from "../repositories/attempts.repository.js";
import type { ISocialPublisher, PublishPayload, PublishResult } from "./publisher.interface.js";
import dotenv from 'dotenv'

dotenv.config()

export class DiscordPublisher implements ISocialPublisher{
  readonly platformName = "Discord";
  async publish(payload: PublishPayload): Promise<PublishResult> {
    try {
      const isAttemptSuccess = await checkAttempt(payload.variantId)
      if (isAttemptSuccess) {
        return { success: false, errorMessage: 'Attempt already successful' }
      }
      console.log('Publishing to Discord');
      const publishResult = await fetch(process.env.DISCORD_WEBHOOK_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!publishResult.ok) {
        await saveAttempt(payload.variantId, 'failed')
        return { success: false, errorMessage: await publishResult.text() }
      }

      await saveAttempt(payload.variantId, 'success')
      console.log('Published to Discord')
      return { success: true }

    } catch (e) {
      if(!(e instanceof Error)) {
        return { success: false, errorMessage: String(e) }
      }
      console.log(e.message)
      return { success: false, errorMessage: e instanceof Error ? e.message : String(e) }
    }
  }
}

export class MockPublisher implements ISocialPublisher{
  readonly platformName: string;
  constructor(platformName: string) {
    this.platformName = platformName
  }
  async publish(payload: PublishPayload): Promise<PublishResult> {
    console.log("Publishing to " + this.platformName)
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Published to ${this.platformName}`)
        resolve({ success: true })
      }, 1000)
    })
  }
}

export function publisherManager(platformName: string): ISocialPublisher | undefined {
  if (platformName === "discord") {
    return new DiscordPublisher();
  }else if(platformName === "x" || platformName === "linkedin") {
    return new MockPublisher(platformName);
  }
}
