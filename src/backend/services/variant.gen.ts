import ai from './gemini_api'

interface Constraint {
  length_min: number,
  length_max: number,
  tone: Array<String>,
  hashtag_min: number,
  hashtag_max: number
}
const constraintX :Constraint= {
  X: {
    length_min: 700,
    length_max: 1200,
    tone: ['Professional', 'Authorative', 'Career Centric'],
    hashtag_min: 3,
    hashtag_max: 5
  }
}

export async function generateVariant() {
  const interaction = await ai.interactions.create({
    model: "gemini-3.7-flash",
    input: ``
    }
  )
}
