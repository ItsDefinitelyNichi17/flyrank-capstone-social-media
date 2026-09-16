import type { ISocialPublisher, PublishPayload, PublishResult } from "./publisher.interface.js";
import dotenv from 'dotenv'

dotenv.config()

export class DiscordPublisher implements ISocialPublisher{
  readonly platformName = "Discord";
  async publish(payload: PublishPayload): Promise<PublishResult> {
    try {
      console.log('Publishing to Discord');
      console.log(process.env.DISCORD_WEBHOOK_URL)
      const publishResult = await fetch(process.env.DISCORD_WEBHOOK_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
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
