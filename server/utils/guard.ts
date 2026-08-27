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
  '<lebenslauf>',
  '<kollegen_feedback>',
  '<haeufige_fragen>',
  '<kurzprofil>',
]

export async function buildOutputGuard(slug: string): Promise<OutputGuard> {
  const feedback = await readDoc(slug, 'feedback.md')

  // Namen der Feedback-Geber aus den Überschriften ziehen. Sie dürfen die
  // Antwort inhaltlich prägen, aber nie namentlich darin auftauchen.
  const names = new Set<string>()
  for (const match of (feedback?.body ?? '').matchAll(/^###\s+(.+?)\s+—/gm)) {
    const full = match[1]!.trim()
    if (/^anonym/i.test(full)) continue
    names.add(full.toLowerCase())
    // Einzelne Namensteile ab 5 Zeichen — fängt "Vestner-Ludwig" ohne Vornamen ab.
    // Kürzere Teile bleiben außen vor, sonst blockieren Allerweltswörter zu viel.
    for (const part of full.split(/[\s]+/)) {
      if (part.length >= 5) names.add(part.toLowerCase())
    }
  }

  return {
    inspect(text: string): string | null {
      const haystack = text.toLowerCase()
      for (const canary of PROMPT_CANARIES) {
        if (haystack.includes(canary)) return `Prompt-Auszug erkannt ("${canary}")`
      }
      for (const name of names) {
        if (haystack.includes(name)) return `Name eines Feedback-Gebers erkannt ("${name}")`
      }
      return null
    },
  }
}
