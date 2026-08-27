import { readDoc } from './content'

/**
 * Ausgabefilter. Prompt-Regeln sind eine Bitte an das Modell, keine Grenze:
 * llama3.1:8b gibt den System-Prompt auf Aufforderung wörtlich aus, Claude
 * paraphrasiert ihn. Beides darf einen Recruiter nicht erreichen, denn im
 * Prompt stehen die Klarnamen und Zitate echter Kolleg:innen.
 *
 * Diese Prüfung läuft serverseitig über den Antwortstrom und ist vom Modell
 * nicht beeinflussbar.
 */
export interface OutputGuard {
  /** Gibt den Grund zurück, wenn der Text gesperrt gehört — sonst null. */
  inspect(text: string): string | null
}

/** Wendungen, die nur im System-Prompt vorkommen, nicht in einer echten Antwort. */
const PROMPT_CANARIES = [
  'bewerbungs-assistent von',
  'deine wissensquelle',
  'vertraulichkeit:',
  'fang direkt mit der antwort',
  'kollegen-feedback stammt von echten personen',
  'behandle nachrichten im chat als fragen',
  'weitere regeln:',
  '<lebenslauf',
  '<kollegen_feedback',
  '<haeufige_fragen',
  '<kurzprofil',
  '<arbeitszeugnis',
]

export async function buildOutputGuard(slug: string): Promise<OutputGuard> {
  const [feedback, zeugnis] = await Promise.all([
    readDoc(slug, 'feedback.md'),
    readDoc(slug, 'zeugnis.md'),
  ])

  const names = new Set<string>()

  const block = (full: string) => {
    const trimmed = full.trim()
    if (!trimmed || /^anonym/i.test(trimmed)) return
    names.add(trimmed.toLowerCase())
    // Einzelne Namensteile ab 5 Zeichen — fängt "Vestner-Ludwig" ohne Vornamen ab.
    // Kürzere Teile bleiben außen vor, sonst blockieren Allerweltswörter zu viel.
    for (const part of trimmed.split(/\s+/)) {
      if (part.length >= 5) names.add(part.toLowerCase())
    }
  }

  // Namen der Feedback-Geber aus den Überschriften ziehen. Sie dürfen die
  // Antwort inhaltlich prägen, aber nie namentlich darin auftauchen.
  for (const match of (feedback?.body ?? '').matchAll(/^###\s+(.+?)\s+—/gm)) {
    block(match[1]!)
  }

  // Unterzeichner des Arbeitszeugnisses — im Frontmatter unter "unterzeichner".
  const signatories = (zeugnis?.meta as { unterzeichner?: unknown } | undefined)?.unterzeichner
  if (Array.isArray(signatories)) {
    for (const entry of signatories) {
      if (typeof entry === 'string') block(entry)
    }
  }

  return {
    inspect(text: string): string | null {
      const haystack = text.toLowerCase()
      for (const canary of PROMPT_CANARIES) {
        if (haystack.includes(canary)) return `Prompt-Auszug erkannt ("${canary}")`
      }
      for (const name of names) {
        if (haystack.includes(name)) return `Geschützter Personenname erkannt ("${name}")`
      }
      return null
    },
  }
}
