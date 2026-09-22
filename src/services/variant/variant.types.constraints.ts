export interface Constraint {
  length_min: number,
  length_max: number,
  tone: Array<string>,
  hashtag_min: number,
  hashtag_max: number
}

export type platforms = "x" | "linkedin" | "discord"

export const constraint = {
  linkedin: {
    length_min: 120,
    length_max: 220,
    tone: ['Professional', 'Authorative', 'Career Centric'],
    hashtag_min: 3,
    hashtag_max: 5
  },
  x: {
    length_min: 140,
    length_max: 200,
    tone: ["Opinioated", "Punchy", "Direct"],
    hashtag_min: 3,
    hashtag_max: 5
  },
  discord: {
    length_min: 110,
    length_max: 250,
    tone: ['Casual', 'Converasational', 'Community Driven'],
    hashtag_min: 0,
    hashtag_max: 0
  }
}
