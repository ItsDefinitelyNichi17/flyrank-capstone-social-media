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
    length_min: 500,
    length_max: 600,
    tone: ['Professional', 'Authorative', 'Career Centric'],
    hashtag_min: 3,
    hashtag_max: 5
  },
  x: {
    length_min: 280,
    length_max: 350,
    tone: ["Opinioated", "Punchy", "Direct"],
    hashtag_min: 3,
    hashtag_max: 5
  },
  discord: {
    length_min: 260,
    length_max: 600,
    tone: ['Casual', 'Converasational', 'Community Driven'],
    hashtag_min: 0,
    hashtag_max: 0
  }
}
