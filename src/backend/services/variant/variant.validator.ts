import { type platforms, type Constraint, constraint} from './variant.constraints'

export function validateVariant(platformType: platforms, hashtagCount: number, content: string): void | Error {
  const constraints = constraint[platformType]
  if (!(hashtagCount <= constraints.hashtag_max && hashtagCount >= constraints.hashtag_min)) {
    return new Error("Invalid variant")
  }
  return
}
