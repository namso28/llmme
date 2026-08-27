export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ProfileLink {
  label: string
  url: string
}

export interface ProfileMeta {
  name: string
  headline?: string
  location?: string
  email?: string
  links?: ProfileLink[]
  suggestedQuestions?: string[]
}

/** Was die Profilseite zum Rendern braucht. Feedback/FAQ gehen nur in den Prompt. */
export interface ProfilePayload {
  slug: string
  meta: ProfileMeta
  introHtml: string
  cvHtml: string
}
