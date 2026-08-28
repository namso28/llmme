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
  /** Pfad zum Porträt unter public/, z. B. "/avatar/osman-turan.jpg". Fehlt es,
   *  stehen die Initialen an seiner Stelle. */
  avatar?: string
  /** Freigestelltes Porträt (transparenter Hintergrund) für die Startseite.
   *  Fehlt es, tritt dort avatar an seine Stelle. */
  avatarCutout?: string
  location?: string
  email?: string
  links?: ProfileLink[]
  suggestedQuestions?: string[]
}

/** Ein Dokument, das im Panel aufgeschlagen werden kann. */
export interface ProfileDoc {
  /** Bezeichnung aus dem Frontmatter, dieselbe, die der Assistent als Quelle nennt. */
  label: string
  html: string
  /** Pfad zum eingescannten Original unter public/, falls hinterlegt. */
  pdf?: string
}

/** Was die Profilseite zum Rendern braucht. Feedback und FAQ gehen weiterhin
 *  nur in den Prompt — sie sind Notizen, keine Dokumente zum Vorzeigen. */
export interface ProfilePayload {
  slug: string
  meta: ProfileMeta
  introHtml: string
  cvHtml: string
  /** Fehlt, wenn keine zeugnis.md hinterlegt ist. */
  zeugnis?: ProfileDoc
}
