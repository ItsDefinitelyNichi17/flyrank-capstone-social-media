import ai from '../gemini_api.js'
import { type platforms, type Constraint, constraint} from './variant.types.constraints.js'
import { validateVariant } from './variant.validator.js';

interface VarianObject {
  content: string;
  hashtag: Array<string>
  platform?: platforms;
}
export async function genEachVarStore(content: string) : Promise<Array<VarianObject | undefined>>{
  const platforms: Array<platforms> = ["x", "linkedin", "discord"];
  const variantsObj = await Promise.all(
    platforms.map((platform) => generateVariant(platform, content))
  );

  const filteredVariants = variantsObj.filter((e, i) => {
    return validateVariant(platforms[i] as platforms, e?.hashtag.length as number, e?.content as string);
  })

  return filteredVariants
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

    return { ...interactionObj, platform };
  } catch (e) {
    if (e instanceof Error) {
      throw e
    }
  }
}
