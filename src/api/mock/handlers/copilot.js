import { ERROR_CODES } from '../../errors'
import { listTopics } from '../catalog'
import { draftFromIdea, previewOf } from '../copilot'
import { OFF_THEME_SUGGESTIONS } from '../data/topics'
import { fail } from '../model'

// Validates an idea and drafts a thesis from it, or explains why it can't.
export function requireDraft(body) {
  const idea = String(body.idea ?? '').trim().replace(/\s+/g, ' ')
  if (idea.length < 12) {
    const message = 'Tell us a bit more. A full sentence works best.'
    fail(422, ERROR_CODES.VALIDATION, message, { idea: message })
  }
  if (idea.length > 280) {
    const message = 'Keep it under 280 characters.'
    fail(422, ERROR_CODES.VALIDATION, message, { idea: message })
  }
  const draft = draftFromIdea(idea)
  if (!draft) {
    fail(422, ERROR_CODES.OFF_THEME, 'Outvest starts with the Climate collection, and this idea doesn’t have a climate angle yet.', {
      suggestions: OFF_THEME_SUGGESTIONS,
    })
  }
  return draft
}

export default [
  {
    method: 'GET',
    path: '/public/themes',
    public: true,
    latency: 120,
    handler: () => ({ themes: [{ key: 'climate', label: 'Climate', live: true, topics: listTopics() }] }),
  },
  {
    // Landing-page preview: the copilot's first pass at an idea, without an account and without saving anything.
    method: 'POST',
    path: '/public/copilot/preview',
    public: true,
    latency: 1600,
    handler: ({ body }) => previewOf(requireDraft(body)),
  },
]
