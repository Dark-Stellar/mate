# StudyMate AI — Which Languages Are Used, Where, and Why (and Why Not the Alternatives)

> Every number in this document was **measured** from the repository at commit `5ea6dc1`, not estimated.
> Reproduce with: `find . -name "*.tsx" -not -path "./node_modules/*" | xargs wc -l`
>
> Companions: [`CODE_MAP.md`](./CODE_MAP.md) · [`PROJECT_INTRO.md`](./PROJECT_INTRO.md) · [`AI_AND_DATA.md`](./AI_AND_DATA.md)

---

## 0. The one-sentence answer

**TypeScript** (as React Native/Expo components) builds the entire mobile app, **JavaScript** (Node.js + Express) builds the AI server, **JSON** is the configuration, network and on-device data format, and **Markdown** is the documentation. There is **no** CSS, HTML, Dart, Kotlin, Swift, Python or PHP anywhere in the project.

---

## 1. Measured language breakdown

| Language | Files | Lines | % of code | Where | What it does |
|---|---|---|---|---|---|
| **TypeScript + JSX** (`.tsx`) | 22 | **7,143** | **88.8%** | `app/**`, `components/**` | Every screen, every UI element, all app logic |
| **TypeScript** (`.ts`) | 6 | **110** | 1.4% | `firebaseConfig.ts`, `constants/theme.ts`, `hooks/*` | Firebase bootstrap, theme tokens, hooks |
| **JavaScript** (`.js`, CommonJS) | 3 | **653** | 8.1% | `backend/server.js` (531), `scripts/reset-project.js` (112), `eslint.config.js` (10) | The AI server; Expo's reset utility; lint config |
| **JSON** | 4 | **134** | 1.7% | `package.json`, `app.json`, `tsconfig.json`, `backend/package.json` | Dependencies, **all** native app config, compiler options |
| **Markdown** | 4 | 2,254 | *(docs)* | `README.md`, `docs/*.md` | Documentation |
| **Total code** | **35** | **8,040** | 100% | | |

**TypeScript is 90.2% of all code** (7,253 of 8,040 lines).

### Languages confirmed **absent** (verified by `find`)

| Absent | Why people assume it's there | Reality |
|---|---|---|
| **Dart** (`.dart`), `pubspec.yaml`, `lib/` | The original report draft said "Flutter" | Zero Dart. The stack is Expo/React Native — `package.json:20,35,37` |
| **CSS / SCSS / HTML** | "React = web = HTML/CSS" | React Native has **no DOM and no CSS engine**. Styling is JS objects — see §3 |
| **Kotlin / Java / XML / Gradle** | "It's an Android app" | No `android/` folder is committed. Native config is **declarative JSON** in `app.json:14-24`, compiled to native at `npx expo prebuild` |
| **Swift / Objective-C / plist** | "It runs on iOS too" | Same reason — `app.json:11-13` |
| **Python** | "AI apps use Python" | The server does **no** ML. It is a thin HTTP proxy to Google's hosted Gemini API — see §4 |
| **SQL** | "There's a database" | There is **no database**. On-device data is JSON strings in AsyncStorage — see §5 |
| **PHP / Ruby / Go** | — | Not used |

---

## 2. TypeScript — the app language (88.8%)

### 2.1 What it is doing

Two dialects in one language:

- **`.tsx` = TypeScript + JSX.** JSX is the tag-like syntax that describes the UI tree, e.g. `app/login.tsx:156-227` (the glass form card). React Native maps those tags to *native* widgets (`<View>` → `android.view.View` / `UIView`, `<Text>` → `TextView` / `UILabel`, `<TextInput>` → `EditText` / `UITextField`) — **not** to HTML.
- **`.ts` = plain TypeScript.** No UI, just logic and config: `firebaseConfig.ts:1-15` (Firebase bootstrap), `constants/theme.ts:11-28` (color tokens), `hooks/use-theme-color.ts:9-22`.

### 2.2 Why TypeScript instead of plain JavaScript

| Reason | Evidence in this repo |
|---|---|
| **Strict mode is on** — `null`, `undefined` and implicit `any` become compile errors | `tsconfig.json:4` `"strict": true` |
| **Domain types make the data shape explicit.** 7 hand-written types describe exactly what a note, session, message or quiz question is | `Note` `app/notes.tsx:20-24` · `StudySession` `app/study-planner.tsx:22-28` + `app/(tabs)/index.tsx:35-41` · `Message` `app/ai-chat.tsx:17-21` · `Question` + `QuizData` `app/quiz.tsx:16-27` · `PDFFile` `app/pdf-summary.tsx:16-21` |
| **State is typed**, so `session.completed` can never be compared against a string by accident | `useState<StudySession[]>` `app/study-planner.tsx:37`; `useState<string \| null>` `:38`; `useState<QuizData \| null>` `app/quiz.tsx:37`; `useState<number \| null>` `:40` |
| **Typed routes** — `router.push("/notes")` is checked at compile time; a misspelled route **fails the build** instead of silently navigating nowhere | `app.json:46` `"typedRoutes": true`; 20 call sites listed in `CODE_MAP.md` §7.3 |
| **The AI boundary is unpredictable.** Gemini returns free-form text that must become a strict JSON shape. Types + validation are the only defense | contract `app/quiz.tsx:16-27` ↔ prompt `backend/server.js:353-388` ↔ validation `:442-505` |
| **Large files stay refactorable.** The dashboard alone is 1,349 lines; renaming a prop without types is guesswork | `app/(tabs)/index.tsx` |
| **Expo ships TypeScript by default** and every dependency provides `.d.ts` typings, so there is no cost to adopting it | `package.json:49`, `tsconfig.json:2` extends `expo/tsconfig.base` |

### 2.3 Why *not* plain JavaScript — honest trade-off

| | TypeScript (chosen) | Plain JavaScript |
|---|---|---|
| Route typos | build error | silent runtime failure |
| `JSON.parse` results from AsyncStorage | still `any` unless asserted — **TS does not protect here** (a real limitation: `app/notes.tsx:94`) | same |
| Setup cost | `tsconfig.json`, type annotations | none |
| Speed of prototyping | slightly slower | faster |
| Verdict | Worth it for a 8,000-line, 9-screen app with an AI data boundary | Fine for a <1,000-line prototype |

Note the one place TypeScript gives **no** protection: data crossing the AsyncStorage boundary is untyped at runtime. `app/notes.tsx:94` does `setNotes(JSON.parse(savedNotes))` with no shape check, whereas `app/study-planner.tsx:89` at least checks `Array.isArray`. That is a genuine gap, not a language strength.

---

## 3. The styling "language" — JavaScript objects, **not CSS**

There are **11 `StyleSheet.create({...})` blocks** (9 real screens + the 2 template screens):
`app/index.tsx:112` · `app/login.tsx:245` · `app/register.tsx:321` · `app/(tabs)/index.tsx:765` · `app/notes.tsx:437` · `app/study-planner.tsx:606` · `app/ai-chat.tsx:320` · `app/quiz.tsx:443` · `app/pdf-summary.tsx:271` · (+ `explore.tsx:101`, `modal.tsx:18`).

```ts
// This is NOT CSS — it is a JavaScript object, type-checked, at app/login.tsx:342-348
card: {
  backgroundColor: "rgba(255, 255, 255, 0.07)",
  borderRadius: 24,
  padding: 22,
  borderWidth: 1,
  borderColor: "rgba(255, 255, 255, 0.12)",
}
```

| Why StyleSheet objects | Consequence |
|---|---|
| React Native renders **native widgets**, so there is no browser, no DOM, no cascade and no CSS parser to speak to | Style names look CSS-like (`backgroundColor`, `borderRadius`) but are camelCase JS keys, validated by RN |
| Styles are **computed at runtime** | The progress bar width is literally calculated from data: ``width: `${progressPercent}%` `` at `app/(tabs)/index.tsx:358` and `app/quiz.tsx:303-305`. Static CSS cannot do this |
| Styles can be **merged conditionally** | `style={[styles.sessionCard, item.completed && styles.completedCard]}` `app/study-planner.tsx:504-508` — the card recolours when a session is done |
| No extra build tooling | Nothing to compile, no PostCSS/Tailwind/Babel plugin chain |

**Why not NativeWind / Tailwind / Tamagui / Unistyles?** The Expo template itself points at them in a comment — `constants/theme.ts:2-3`. Honest trade-off:

| | StyleSheet (chosen) | NativeWind/Tailwind |
|---|---|---|
| Tooling | none | Metro/Babel transform layer |
| Consistency | **weak** — this project proves it: the glow-blob styles are copy-pasted 4× (`app/index.tsx:125-154`, `app/login.tsx:258-287`, `app/register.tsx:334-363`, `app/(tabs)/index.tsx:778-810`) and 5 screens never load Poppins (`CODE_MAP.md` §13.2) | strong — utility classes + a design-token file |
| Runtime-computed styles | native | needs inline escape hatches |

So: StyleSheet was the zero-config choice, and its cost is visible in the duplication noted above.

---

## 4. JavaScript (Node.js + Express) — the AI server (8.1%)

### 4.1 What it is doing

`backend/server.js` (531 lines, CommonJS — `require()` at `:1-5`, no `"type"` field in `backend/package.json`, so Node defaults to CommonJS) does exactly four jobs:

1. Expose 3 HTTP endpoints — `:105-109`, `:114-238`, `:243-317`, `:322-519`
2. Hold the **Gemini secret key** so the phone never sees it — `:31-34`, `:39-41`
3. **Stream / validate / clean** model output — `:211-217`, `:399-436`, `:442-505`
4. **Retry** on rate limits with exponential backoff — `:51-100`

The frontend, by contrast, uses **ES modules** (`import`/`export`) — e.g. `app/_layout.tsx:1-16`. Two module systems in one repo, each following its own runtime's convention.

### 4.2 Why JavaScript and not TypeScript on the server

| Reason | Evidence |
|---|---|
| **No build step.** `npm start` → `node server.js` runs the file directly | `backend/package.json:6` |
| No `tsconfig.json`, no `typescript` dependency in the backend | `backend/package.json:8-14` |
| 531 lines with 3 routes — the type payoff is small | — |
| The data it handles is inherently `any`: Gemini's raw text output | `backend/server.js:399` `response.text` |

**Honest trade-off:** typing the quiz contract (`{topic, difficulty, questions[]}`) as a shared TS interface used by *both* tiers would remove the duplicated validation logic and the duplicated `StudySession` type. That is the strongest argument for converting the backend to TypeScript, and it was not taken here.

### 4.3 Why not Python (FastAPI/Flask/Django)?

This is the most common question, so here is the honest answer.

**The server performs no machine learning.** It never loads a model, never touches tensors, never runs pandas/numpy. It is an **I/O-bound HTTP proxy**: receive JSON → call Google's hosted API → clean/validate the reply → send it back. For that workload:

| Consideration | Node.js (chosen) | Python |
|---|---|---|
| Non-blocking I/O + native async streams | First-class. The chat stream is a `for await` loop writing chunks straight to the socket — `backend/server.js:211-217` | Achievable (asyncio/FastAPI) but a different idiom |
| **One language end-to-end** | ✅ The quiz JSON schema is reasoned about identically on both tiers (`app/quiz.tsx:16-27` ↔ `backend/server.js:353-388`) | Two languages, two type systems |
| JSON handling | Native — `JSON.parse`/`stringify`, zero serialization library | Needs `json` module / Pydantic |
| Official Gemini SDK | `@google/genai` `backend/package.json:9` | `google-genai` — **equally official**, no capability loss |
| Multipart file upload | `multer` `:21-26` | `python-multipart` — equivalent |
| Team skill overlap | Same language as the app | Separate skill set |
| **Where Python would win** | — | Local/offline models, embeddings + vector search, RAG over a corpus, heavy text analytics, data-science pipelines |

**Verdict:** Python is not *wrong* — it is *unnecessary*. The deciding factor is **language consistency with the client**, not capability. If StudyMate AI later added local embeddings or a vector store, Python would become the better choice for that service.

### 4.4 Why not PHP / Ruby / Go?

- **PHP** — request-per-page lifecycle on shared hosting fits CRUD sites, not an always-on streaming AI proxy (`res.write` chunks over a kept-alive connection, `backend/server.js:137-142`, `:211-217`).
- **Go** — excellent for this (single static binary, great concurrency), but it would introduce a third language into a two-language project for no functional gain at this scale.
- **Ruby/Rails** — heavy framework for 3 stateless endpoints; no AI-ecosystem advantage.

---

## 5. JSON — three separate jobs (1.7% as files, but it is everywhere at runtime)

| Role | Where | Why JSON |
|---|---|---|
| **A. Build & native configuration** | `package.json` (deps, scripts) · **`app.json` — the ENTIRE Android/iOS/web configuration** (`:14-24` package name, adaptive icon, edge-to-edge; `:29-44` plugins; `:45-48` experiments) · `tsconfig.json` (compiler) | Declarative, diff-friendly, no Gradle XML or plist committed. Expo reads it and *generates* the native projects at `npx expo prebuild` |
| **B. Network wire format** | app → server: `Content-Type: application/json` (`app/ai-chat.tsx:61-63`, `app/quiz.tsx:65-67`), parsed by `express.json()` (`backend/server.js:16`). Server → app: `res.json(...)` (`:301-304`, `:507`). Server → Gemini: the quiz prompt **demands** JSON (`:353-388`) | Language-neutral, native in JS, and Gemini's structured output is JSON — so the same format flows phone → server → model → server → phone with **zero translation** |
| **C. The on-device "database"** | AsyncStorage stores **strings only**, so every write is `JSON.stringify` and every read is `JSON.parse` — 8 call sites: `app/notes.tsx:112`/`:94`, `app/study-planner.tsx:123`/`:87`, `app/(tabs)/index.tsx:90`, plus request bodies `app/ai-chat.tsx:64`, `:89`, `app/quiz.tsx:68` | Human-readable, no ORM, no migrations, no schema tooling. Shape examples in `AI_AND_DATA.md` §2.3 |

**Why not SQL / SQLite queries?** AsyncStorage is backed by SQLite on Android but deliberately exposes only a **key → string** API. For a few hundred notes and sessions that is sufficient, and it means zero query code. The cost: **no querying or indexing**, so note search filters the whole array in JavaScript on every render — `app/notes.tsx:211-218`. Fine at this scale; it would not be at 10,000 notes.

---

## 6. English (natural language) — the prompt language

Two prompts are written in English prose inside JS template literals:

| Prompt | Location | Content |
|---|---|---|
| PDF summariser | `backend/server.js:262-279` | *"You are StudyMate AI, an academic study assistant…"* — demands 6 sections: Main Topic, Key Points, Important Definitions, Important Concepts, Short Summary, Exam/Study Notes; "Use simple English"; "Do not include information that is not present in the PDF" |
| Quiz generator | `backend/server.js:344-389` | *"You are StudyMate AI, an academic quiz generator…"* — 14 numbered rules including the critical **"correctAnswer is a ZERO-BASED INDEX"** contract (`:377-383`), "Do not include markdown", "Return valid JSON only" |

**Why English prompts:**
1. Instruction-following and JSON-schema adherence are most reliable in English for Gemini.
2. The app's UI is English, so English output needs no translation layer.
3. The rules must be unambiguous — rule 4-8 (`:378-383`) spell out `Option A = 0 … Option D = 3` precisely because the client indexes arrays with that number (`app/quiz.tsx:105`, `:320`).

**This does not restrict the student.** A user may type in Bangla in the chat (`app/ai-chat.tsx:270-282` sends raw text, `backend/server.js:160` passes it through verbatim) and the model will answer in Bangla.

Also present: **Bengali developer comments** in the source — `app/ai-chat.tsx:70, 85, 87, 97` explain the JSON-or-plain-text response handling. These are comments for the developer, not part of any language runtime.

---

## 7. Small DSLs you are also technically using

| DSL | Where | Purpose |
|---|---|---|
| **gitignore patterns** | `.gitignore:1-15` | `.env` (`:2`) and `.env.*` (`:3`) keep the **Gemini key out of git**; `!.env.example` (`:4`) would allow a template |
| **dotenv `KEY=value`** | `backend/.env` (not committed), read at `backend/server.js:7` | Secret injection |
| **HTTP/REST + `multipart/form-data`** | `app/pdf-summary.tsx:81-87` ↔ `backend/server.js:245` | The PDF upload contract — the field name **`"pdf"`** is the coupling point; rename one side and uploads break |
| **Expo config plugins** | `app.json:29-44` | Declarative native build configuration (`expo-router`, `expo-splash-screen`, `expo-font`) |
| **URI scheme** | `app.json:8` `studymatego://` | Deep linking |
| **Markdown** | `README.md`, `docs/*.md` (2,254 lines) | Documentation that renders on GitHub |

---

## 8. Why not the alternatives — full comparison

| Alternative | What you would gain | Why it is not used here / what you would lose |
|---|---|---|
| **Flutter (Dart)** | One UI engine rendered identically on both platforms; consistently smooth 60/120fps animation; strong widget catalogue; Dart's sound null safety | Would mean **rewriting all 7,253 lines**. React Native was chosen for the JS/TS ecosystem, the Expo managed workflow, and one language shared with the backend. Flutter's rendering is *more* consistent, but RN uses real native widgets, which feels more platform-native. **The repo contains zero Dart** — the original report draft claiming Flutter was simply wrong |
| **Native Kotlin (Android) + Swift (iOS)** | Best possible performance, full platform API access, no bridge | **Two codebases, double the work**, and no web build. This is a student project with 9 screens — one codebase for Android + iOS + web (`app.json:11-28`) is the deciding factor |
| **React Native CLI ("bare") instead of Expo** | Full control over native code | You would maintain `android/` and `ios/` folders by hand. Expo gives native config as JSON (`app.json`) + `prebuild`/EAS cloud builds, OTA updates, and managed plugins — used here at `app.json:29-44` |
| **Python / FastAPI backend** | Better fit for local models, embeddings, RAG, data science | The server does no ML — it is an I/O-bound proxy. Node keeps **one language across both tiers**. See §4.3 for the full trade-off table |
| **Firebase Cloud Functions instead of your own server** | No local server to run, no `10.0.2.2` emulator hack, HTTPS + auth out of the box, scales automatically | Requires the Blaze (pay-as-you-go) plan and a deploy pipeline. The current design's real weakness is that **the AI only works while your PC is running the server** — Cloud Functions would fix that. Same security property (key stays server-side) |
| **Firestore instead of AsyncStorage** | Cloud sync across devices, real queries, Security Rules, offline persistence with automatic merge | Requires modelling collections, writing rules, and handling async snapshots. AsyncStorage was chosen for **simplicity and zero backend**. The cost is real: **notes and study plans do not sync to a new phone** (`AI_AND_DATA.md` §2.4) |
| **Supabase / PostgreSQL / MongoDB** | A real queryable database, server-side auth, row-level security | Adds a hosted service, a schema and a network dependency for data that is currently fine as two JSON blobs per user |
| **GraphQL instead of REST** | One endpoint, client-driven field selection, typed schema | Three endpoints with fixed shapes do not need it. REST + `fetch` is simpler and the JSON contract is already strict (`backend/server.js:442-505`) |
| **Tailwind / NativeWind** | Design consistency, less duplicated style code | Adds a build transform. The duplication it would have prevented is documented in `CODE_MAP.md` §13.2 and §3 above |
| **Plain JavaScript everywhere** | Faster to write, no compilation | Loses typed routes (`app.json:46`), the 7 domain types and strict-null checking across 8,040 lines |

---

## 9. The real architectural reason: **one language on both tiers**

```
        ┌─────────────────────── ONE LANGUAGE FAMILY ───────────────────────┐
        │                     JavaScript / TypeScript                       │
        │                                                                   │
  📱 APP│  TypeScript + JSX (90.2%)          🖥 SERVER │  JavaScript (8.1%) │
        │  app/**, components/**                       │  backend/server.js │
        │                                              │                    │
        │        JSON is the native data format on BOTH sides — no         │
        │        serialization library, no schema translation layer        │
        └───────────────────────────────────────────────────────────────────┘
                                    │
                     ┌──────────────┴──────────────┐
              ☁️ Firebase Auth              🤖 Google Gemini
              (identity only)               (AI, via the server)
              SDK: firebase JS v12          SDK: @google/genai
```

Every external service is also consumed through a **JavaScript SDK**: `firebase` v12 (`package.json:34`) and `@google/genai` (`backend/package.json:9`). So a single developer holds one language, one package manager (`npm`), one module ecosystem and one debugging toolset for the whole product. That consistency — not raw performance — is the answer to "why these languages".

---

## 10. Viva / defence Q&A

**Q: Which language is the app written in?**
A: TypeScript with JSX, running on React Native 0.81 through Expo SDK 54 — 7,143 lines across 22 `.tsx` files, strict mode enabled (`tsconfig.json:4`).

**Q: Is it Flutter?**
A: No. There is no Dart code, no `pubspec.yaml` and no `lib/` directory in the repository. It is Expo/React Native.

**Q: Why TypeScript and not JavaScript?**
A: Strict null checking across 8,000 lines, seven explicit domain types for notes, sessions, messages and quiz data, and compile-time-verified route names (`app.json:46`) — a misspelled navigation target fails the build instead of silently doing nothing.

**Q: Why is there a Node.js server at all — why not call Gemini from the app?**
A: To keep the Gemini API key off the device. The key lives only in `backend/.env` and is read once at `backend/server.js:40`; if the key is missing the server refuses to start (`:31-34`). The app only ever talks to `http://10.0.2.2:3000`.

**Q: Why JavaScript for the backend and not Python?**
A: The backend does no machine learning — it is an I/O-bound proxy that parses JSON, calls Google's hosted model, validates the reply and streams it back. Using JavaScript keeps one language across both tiers, and JSON needs no translation. Python would only win if we ran local models, embeddings or RAG.

**Q: Is there a database?**
A: No. Firebase provides Authentication only. Student content is stored on the device in AsyncStorage as JSON strings under keys suffixed with the Firebase `uid` — five read/write calls in total (`app/notes.tsx:91,110`; `app/study-planner.tsx:84,121`; `app/(tabs)/index.tsx:87`). The trade-off is that data does not sync between devices.

**Q: Why JSON for storage instead of SQLite?**
A: AsyncStorage only accepts strings, and the data is two small arrays per user with no relational queries. JSON needs no ORM, no migrations and is human-readable. Search is therefore done by filtering in memory (`app/notes.tsx:211-218`), which is fine for hundreds of notes.

**Q: Why is there no CSS?**
A: React Native renders native widgets, not a web page — there is no DOM and no CSS engine. Styling uses `StyleSheet.create` objects (11 of them), which additionally allows styles to be **computed from data**, e.g. the progress bar width ``width: `${progressPercent}%` `` at `app/(tabs)/index.tsx:358`.

**Q: Which language are the AI prompts in?**
A: English, embedded as template literals at `backend/server.js:262-279` (PDF summary) and `:344-389` (quiz). English gives the most reliable instruction-following and JSON-schema adherence. Students can still ask questions in Bangla — the prompt language does not restrict the user's language.

**Q: What would you improve?**
A: Move the backend to TypeScript and share the quiz/session types with the app; replace AsyncStorage with Firestore for cross-device sync; deploy the AI endpoints as Cloud Functions so they do not depend on a laptop being online; and centralise the styling tokens to remove the four duplicated glow-style blocks.

---

## 11. One-paragraph summary

StudyMate AI is written in **two dialects of one language family**: the mobile app is **TypeScript with JSX** on React Native 0.81 / Expo SDK 54 — 7,143 lines across 22 `.tsx` files plus 110 lines of `.ts` configuration, strict mode on (`tsconfig.json:4`), seven hand-written domain types, and compile-time-checked route names (`app.json:46`) — while the AI server is plain **CommonJS JavaScript** on Node.js and Express 5 (`backend/server.js`, 531 lines), deliberately kept build-step-free so `node server.js` just runs. **JSON** carries three separate loads: it is the entire native build configuration (`app.json` — no Gradle XML or plist is committed), the wire format between phone, server and Gemini, and the on-device storage format, because AsyncStorage accepts only strings. Styling uses **JavaScript `StyleSheet` objects rather than CSS** (11 blocks), since React Native renders native widgets and has no DOM — which also lets styles be computed from data (`app/(tabs)/index.tsx:358`). The AI prompts are **English prose** in template literals (`backend/server.js:262-279`, `:344-389`) for reliable instruction-following, and documentation is **Markdown**. The alternatives were rejected for concrete reasons: **Flutter/Dart** is absent entirely and would mean rewriting everything for a UI-consistency gain that does not outweigh losing the shared language with the backend; **native Kotlin/Swift** would double the work and lose the web build; **Python** would add a second language for a server that does no machine learning, only I/O-bound proxying, streaming and JSON validation; and **Firestore or SQL** would add a schema and rules engine for data that is currently two small JSON arrays per user — accepting, as the honest cost, that notes and study plans do not sync across devices.
