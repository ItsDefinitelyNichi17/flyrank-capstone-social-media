import ai from '../gemini_api'
import { type platforms, type Constraint, constraint} from './variant.constraints'

export async function generateEachVariant() {

}

export async function generateVariant(platform: platforms, content: string) {
  const Obj: Constraint = constraint[platform]
  try {
    const interaction = await ai.interactions.create({
      model: "gemini-3.5-flash-lite",
      input: `Generate a ${platform} campaigh post/caption for "${content}" markdown.
      With
        min-char${Obj.length_min},
        max-char${Obj.length_max},
        tone${Obj.tone},
        hashstag-min${Obj.hashtag_min},
        hashstag-max${Obj.hashtag_max}. Return it as a object literal {content, hashtag}`,

    })
    console.log(interaction.output_text)
  } catch (e) {
    if (e instanceof Error) {
      throw e
    }
  }
}

// generateVariant('linkedin', "Retirement in India is experiencing a quiet but important transformation. For today's older adults, retirement is increasingly about having the freedom to choose how they spend their time, remain socially connected, stay physically active, and enjoy a comfortable home without being burdened by everyday responsibilities.\
//   This changing mindset is encouraging families to explore professionally managed retirement communities that are designed specifically around the needs of seniors.Gurgaon, with its healthcare infrastructure, connectivity, modern amenities, and expanding residential areas, is becoming an attractive destination for this new approach to retirement")
