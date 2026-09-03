import ai from '../gemini_api'
import { type platforms, type Constraint, constraint} from './variant.types.constraints'
import { validateVariant } from './variant.validator';

interface VarianObject {
  content: string;
  hashtag: Array<string>
}
export async function genEachVarStore(content: string) {
  const platforms: Array<platforms> = ["x", "linkedin", "discord"];
  const variantsObj = await Promise.all(
    platforms.map((platform) => generateVariant(platform, content))
  );

  const filteredVariants = variantsObj.filter((e, i) => {
    if (validateVariant(platforms[i], e?.hashtag.length as number, e?.content as string)) {
      return e
    }
  })
  console.log(filteredVariants)

}


export async function generateVariant(platform: platforms, content: string)
    : Promise<VarianObject | undefined>{
  const Obj: Constraint = constraint[platform]
  try {
    const interaction = await ai.interactions.create({
      model: "gemini-3.5-flash-lite",
      input: `Generate a ${platform} campaigh post/caption for "${content}" markdown.
      With
        min-characters ${Obj.length_min},
        max-characters ${Obj.length_max},
        tone ${Obj.tone},
        hashstag-min ${Obj.hashtag_min},
        hashstag-max ${Obj.hashtag_max}. Return it as a json dont wrap it on \`\`\` block{content, hashtag[]}.`,
    })
    const interactionObj= JSON.parse(interaction.output_text as string);

    return interactionObj as VarianObject;
  } catch (e) {
    if (e instanceof Error) {
      throw e
    }
  }
}

genEachVarStore("Retirement in India is experiencing a quiet but important transformation. For today's older adults, retirement is increasingly about having the freedom to choose how they spend their time, remain socially connected, stay physically active, and enjoy a comfortable home without being burdened by everyday responsibilities.\
This changing mindset is encouraging families to explore professionally managed retirement communities that are designed specifically around the needs of seniors.Gurgaon, with its healthcare infrastructure, connectivity, modern amenities, and expanding residential areas, is becoming an attractive destination for this new approach to retirement")
