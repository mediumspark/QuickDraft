export const AI_STATUS = {
  ai_free: {
    id: 'ai_free',
    label: 'AI Free',
    short: 'No AI used',
    description: 'Written entirely by a human. Can be shared to the forum with section comments.',
  },
  ai_contributed: {
    id: 'ai_contributed',
    label: 'AI Contributed',
    short: 'AI helped',
    description: 'Human writing with AI help. Can be shared; views are author-only; no section comments.',
  },
  ai_generated: {
    id: 'ai_generated',
    label: 'AI Generated',
    short: 'Mostly AI',
    description: 'Substantially AI-written. Cannot be shared to the forum. Views are not tracked.',
  },
}

export const WRITING_PROMPTS = [
  'Write about a door that only opens for people who are lost.',
  'Describe the last conversation two strangers will ever have.',
  'A character finds a letter addressed to them, dated ten years in the future.',
  'Write a scene that takes place entirely in an elevator.',
  'Someone inherits a house that rearranges its rooms every night.',
  'Tell a story using only things overheard on a bus.',
  'A rainy afternoon when everything finally makes sense — or doesn’t.',
  'Write about the quietest moment of someone’s loudest day.',
  'A recipe that is also a confession.',
  'Two childhood friends meet again and realize they remember different versions of the same summer.',
]

export const TIMER_PRESETS = [
  { label: '15 min', seconds: 15 * 60 },
  { label: '25 min', seconds: 25 * 60 },
  { label: '45 min', seconds: 45 * 60 },
  { label: '60 min', seconds: 60 * 60 },
]

export const FEEDBACK_VISIBILITY = {
  author_only: { id: 'author_only', label: 'Only me', description: 'Only you can read feedback' },
  accounts_only: { id: 'accounts_only', label: 'Account holders', description: 'Signed-in users can read feedback' },
  public: { id: 'public', label: 'Public', description: 'Anyone can read feedback' },
}

export function formatTime(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}
