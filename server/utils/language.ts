/**
 * Grobe Spracherkennung für die zuletzt gestellte Frage.
 *
 * Warum überhaupt: Die Prompt-Regel "antworte in der Sprache der Frage" trägt
 * nur so weit wie das Modell. Kleinere Modelle folgen dem Gesprächsverlauf —
 * eine englische Frage nach deutschen Turns wurde zuverlässig deutsch
 * beantwortet. Ein Hinweis unmittelbar an der Frage wirkt dagegen auch dort.
 *
 * Bewusst keine Bibliothek und kein Modellaufruf: Es geht um zwei Sprachen und
 * um kurze Fragen. Häufige Funktionswörter reichen, und im Zweifel wird nichts
 * angehängt — dann entscheidet weiterhin die Regel im System-Prompt.
 */
const DEUTSCH = /\b(der|die|das|und|ist|wie|was|welche|welchen|seine|seiner|ihm|er|sie|mit|für|von|hat|kann|wer|wann|wo|warum|über|beim|im|am|zum|zur|nicht|auch|sehr|arbeitet|erzähl|kannst|du)\b/gi
const ENGLISCH = /\b(the|and|is|what|how|which|his|him|he|she|with|for|of|has|can|who|when|where|why|about|does|do|you|your|are|tell|me|about)\b/gi

export type Sprache = 'de' | 'en'

export function erkenneSprache(text: string): Sprache | null {
  const deutsch = (text.match(DEUTSCH)?.length ?? 0) + (/[äöüß]/i.test(text) ? 2 : 0)
  const englisch = text.match(ENGLISCH)?.length ?? 0

  // Gleichstand oder gar keine Treffer: lieber nichts sagen als das Falsche.
  if (deutsch === englisch) return null
  return deutsch > englisch ? 'de' : 'en'
}

/** Der Hinweis steht in der Zielsprache — das wirkt stärker als eine Beschreibung. */
export function sprachHinweis(sprache: Sprache): string {
  return sprache === 'en' ? 'Answer in English.' : 'Antworte auf Deutsch.'
}
