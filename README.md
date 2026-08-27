# llmme

Ein Lebenslauf, mit dem man reden kann. Recruiter rufen `/<slug>` auf, sehen den
Lebenslauf und können im Chat Fragen dazu stellen. Kein Login, keine Datenbank.

## Inhalte pflegen

Ein Ordner pro Person unter `content/`. Der Ordnername ist der Slug in der URL —
`content/osman-turan/` wird zu `/osman-turan`.

| Datei | Sichtbar auf der Seite | Im Prompt |
|---|---|---|
| `profile.md` | ✅ Kopfzeile + Kurzprofil | ✅ |
| `cv.md` | ✅ Lebenslauf | ✅ |
| `feedback.md` | ❌ | ✅ |
| `faq.md` | ❌ | ✅ |

`feedback.md` und `faq.md` werden bewusst **nicht** ausgeliefert — sie prägen die
Antworten des Assistenten, stehen aber nicht öffentlich auf der Seite.

> ⚠️ **`feedback.md` enthält Aussagen Dritter.** Das `ProfilePayload`-Objekt in
> `shared/types.ts` hat bewusst kein Feld dafür, und `server/api/profile/[slug].get.ts`
> liest die Datei nicht. Wer hier ein Feld ergänzt, veröffentlicht Namen und Zitate
> von Kolleg:innen auf einer Seite ohne Login. Im Zweifel in der Quelldatei
> anonymisieren ("Teamlead", "Kollegin aus dem Frontend-Team") statt sich auf die
> Server-Grenze zu verlassen.

Eine leere Datei — oder eine, die nur HTML-Kommentare enthält — wird übersprungen
und taucht im Prompt gar nicht erst auf.

### Ausgabefilter (`server/utils/guard.ts`)

Prompt-Regeln sind eine Bitte an das Modell, keine Grenze. Getestet:
`llama3.1:8b` gibt den System-Prompt auf Aufforderung **wörtlich** aus, Claude
Opus 5 paraphrasiert ihn. Beides würde die Namen und Zitate aus `feedback.md`
in Reichweite eines Besuchers bringen.

Deshalb prüft der Server jeden Antwortstrom gegen zwei Listen:

- Wendungen, die nur im System-Prompt vorkommen
- die Namen der Feedback-Geber, automatisch aus den `###`-Überschriften gelesen

Die ersten 240 Zeichen werden zurückgehalten, bis die Prüfung durch ist — ein
Prompt-Dump beginnt sofort mit den Regeln und wird erkannt, bevor etwas gerendert
wird. Schlägt die Prüfung an, wird die Antwort verworfen und der Vorfall
geloggt.

Wer den System-Prompt umformuliert, sollte die Wendungen in `PROMPT_CANARIES`
mitziehen.

Die Frage-Vorschläge im Chat stehen im Frontmatter von `profile.md` unter
`suggestedQuestions`.

### Kein RAG

Lebenslauf, Feedback und FAQ sind zusammen ein paar tausend Tokens und gehen
vollständig in den System-Prompt. Keine Embeddings, keine Vektor-DB, kein
Retrieval, das die falsche Passage zieht. Erst wenn die Inhalte deutlich wachsen
(> ~50 Seiten) lohnt sich etwas anderes.

## Lokal entwickeln (ohne Drittanbieter)

```bash
ollama serve
ollama pull llama3.1:8b
cp .env.example .env
npm install
npm run dev
```

Standard ist `LLM_PROVIDER=ollama` — kein API-Key, keine externe Anfrage.

## Deployment auf Vercel

Vercel erkennt Nuxt automatisch; eine `vercel.json` ist nicht nötig. Setze in den
Projekt-Einstellungen:

```
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-opus-5
```

Ein lokales Modell kann auf Vercel nicht laufen (keine GPU, kein langlebiger
Prozess) — deshalb der Adapter.

## Provider wechseln

`server/utils/llm.ts` enthält ein Interface und zwei Adapter. Ein dritter Anbieter
ist eine Funktion, die `LLMProvider` zurückgibt, plus ein Zweig in
`getLLMProvider()`. Der Rest der App weiß nicht, welches Modell antwortet.

## Befehle

```bash
npm run dev        # Entwicklung
npm run build      # Produktions-Build
npm run preview    # Build lokal testen
npm run typecheck  # Typen prüfen
```
