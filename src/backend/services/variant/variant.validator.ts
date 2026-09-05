import { type platforms, type Constraint, constraint} from './variant.types.constraints.js'

export function validateVariant(platformType: platforms, hashtagCount: number, content: string): boolean{
  const constraints = constraint[platformType]
  // console.log("Length of text: " + content.length + " (min: " + constraints.length_min + ", max: " + constraints.length_max + ")")
  // console.log((content.length <= constraints.length_max && content.length >= constraints.length_min));
  return ((hashtagCount <= constraints.hashtag_max && hashtagCount >= constraints.hashtag_min) &&
    (content.length <= constraints.length_max && content.length >= constraints.length_min))
}
