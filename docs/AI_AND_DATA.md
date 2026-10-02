# StudyMate AI — API Key, Data Storage & AI Wiring

> Answers three questions with exact file:line evidence (source at commit `5ea6dc1`):
> **1)** How does the Gemini API key work? **2)** How and where is data stored?
> **3)** How is the AI connected to the rest of the app?
>
> Companions: [`CODE_MAP.md`](./CODE_MAP.md) (full line map) · [`PROJECT_INTRO.md`](./PROJECT_INTRO.md) (report wording)

---

## Part 1 — How the Gemini API key works

### 1.1 ⚠️ There are TWO different API keys in this project — do not confuse them

| | **Firebase web API key** | **Gemini API key** |
|---|---|---|
| Where it lives | `firebaseConfig.ts:5` — **hard-coded in the app source, committed to git** | `backend/.env` — **never committed** (`.gitignore:2-4`) |
| Value in this repo | `AIzaSyDcErCix4PFOxUX8E8D16iL1mkXDRUKnRg` | *not present — you must create the file* |
| Who uses it | The mobile app itself (runs on the student's phone) | Only the Node server (`backend/server.js:40`) |
| Is it a secret? | **Not really.** Firebase web API keys are project *identifiers*, published in every Firebase web app. Protection comes from Firebase **Security Rules** + **App Check**, not from hiding the key. | **Yes — a real secret.** Anyone with it can spend your Google AI quota/billing. |
| What it unlocks | Firebase Authentication for project `studymate-ai-d8550` (`firebaseConfig.ts:7`) | Google Gemini model calls (`gemini-3.6-flash`) |
| If leaked | Attacker can attempt auth operations against your project (enumeration, quota burn) — mitigated by rules/App Check | Attacker can run up **your AI bill** and exhaust quota |

This is exactly why the architecture is split: the *identifying* key ships inside the app, the *billing* key stays on the server.

### 1.2 The Gemini key's complete journey (5 steps)

```
STEP 1 — You create the file (once, manually; it is NOT in git)
   backend/.env
   ┌──────────────────────────────────────┐
   │ GEMINI_API_KEY=your_real_key_here    │
   └──────────────────────────────────────┘
   Protected from git by:  .gitignore:2  ".env"
                           .gitignore:3  ".env.*"
                           .gitignore:4  "!.env.example"  (an example file WOULD be allowed — none exists yet)
        ▼
STEP 2 — dotenv loads it into the process environment
   backend/server.js:3    const dotenv = require("dotenv");
   backend/server.js:7    dotenv.config();        ← reads backend/.env at startup
        ▼
STEP 3 — Fail-fast guard: no key ⇒ the server refuses to boot
   backend/server.js:31-34
       if (!process.env.GEMINI_API_KEY) {
         console.error("GEMINI_API_KEY is missing.");
         process.exit(1);                         ← hard exit, code 1
       }
   ⇒ You will NEVER get a half-working server. If it starts, the key exists.
        ▼
STEP 4 — One client object is built ONCE at module load and reused by every request
   backend/server.js:5    const { GoogleGenAI } = require("@google/genai");
   backend/server.js:39-41
       const ai = new GoogleGenAI({
         apiKey: process.env.GEMINI_API_KEY,      ← the ONLY place the key is read
       });
   backend/server.js:46   const GEMINI_MODEL = "gemini-3.6-flash";
        ▼
STEP 5 — Each route uses that same `ai` object; the key is never passed again
   • non-streaming helper  backend/server.js:60-63   ai.models.generateContent({ model: GEMINI_MODEL, contents })
        used by  PDF summary  :298-299   and  Quiz  :396-397
   • streaming             backend/server.js:157-161 ai.models.generateContentStream({ model: GEMINI_MODEL, contents })
        used by  Chat       :157-161
```

**Single point of change:** to rotate the key, edit `backend/.env` and restart. To change the model, edit **one line** — `backend/server.js:46` — and all three features follow (`:61`, `:159`, logged at `:530`).

### 1.3 The mobile app never touches the Gemini key

```
┌── ANDROID APP ──────────────────────────┐          ┌── YOUR PC (Node server) ─────────────────┐
│                                          │          │                                          │
│ app/ai-chat.tsx:59                       │          │ backend/server.js:114  app.post("/chat") │
│ app/quiz.tsx:63                          │  HTTP    │ backend/server.js:243  /summarize-pdf    │
│ app/pdf-summary.tsx:99                   │ ───────► │ backend/server.js:322  /generate-quiz    │
│   fetch("http://10.0.2.2:3000/…")        │  JSON /  │            │                             │
│                                          │ multipart│            ▼                             │
│ ❌ no GEMINI key here                    │          │ backend/server.js:40  apiKey: process.env│
│ ✅ only the Firebase key                 │          │            │        .GEMINI_API_KEY      │
│    (firebaseConfig.ts:5)                 │          │            ▼                             │
└──────────────────────────────────────────┘          │      Google Gemini API (internet)        │
                                                       └──────────────────────────────────────────┘
```
Verified by grep: the strings `GEMINI` / `AIza` / `apiKey` appear **nowhere** in `app/`, `components/` or `hooks/` — the only hit in the whole frontend is the Firebase key at `firebaseConfig.ts:5`.

### 1.4 Set it up — step by step

```bash
# 1. Get a key: https://aistudio.google.com/apikey  →  "Create API key"
# 2. Create the env file (this file must exist or the server exits at server.js:31-34)
cd backend
echo 'GEMINI_API_KEY=paste_your_key_here' > .env

# 3. Install & start
npm install          # deps: backend/package.json:8-14
npm start            # → node server.js  (backend/package.json:6)

# 4. Expected boot output (server.js:524-531)
#    StudyMate AI backend running on port 3000
#    Gemini model: gemini-3.6-flash

# 5. Prove the key works end-to-end
curl http://localhost:3000/                                   # health → server.js:105-109
curl -X POST http://localhost:3000/chat \
     -H "Content-Type: application/json" \
     -d '{"message":"Explain photosynthesis in one sentence"}' # → streams text (server.js:211-217)
```

`git check-ignore -v backend/.env` should print `.gitignore:2:.env` — that is your proof the key cannot be committed.

### 1.5 Hardening recommendations (current state → target)

| # | Now | Do this |
|---|---|---|
| 1 | Gemini key in a local `.env`, server bound to `0.0.0.0` (`server.js:524`) with `cors()` wide open (`server.js:15`) | For anything beyond your own LAN: restrict CORS to your app origin, and put the server behind HTTPS/a tunnel |
| 2 | No `.env.example` | Add `backend/.env.example` containing `GEMINI_API_KEY=` so a fresh clone knows what to create (allowed by `.gitignore:4`) |
| 3 | Firebase key hard-coded + committed (`firebaseConfig.ts:5`) | Enable **Firebase App Check**, restrict the key in Google Cloud console, and move config to `EXPO_PUBLIC_*` env vars read through `expo-constants` |
| 4 | No per-user limits on the AI endpoints | The backend does not know *who* is calling — see §3.6 |
| 5 | Key rotates only by editing `.env` | Fine for a student project; on a real deployment use the host's secret manager |

---

## Part 2 — How and where data is stored

### 2.1 ⚠️ There is **no database** in this project

Verified by grep: **zero** occurrences of `firestore`, `database()`, `firebase/storage`, `collection(`, `doc(`, `ref(` in `app/`, `backend/` or `firebaseConfig.ts`. `firebaseConfig.ts:1-2` imports only `firebase/app` and `firebase/auth`.

Instead there are **four storage layers**, and only two of them persist:

| Layer | Where | Technology | Holds | Persists? | Code |
|---|---|---|---|---|---|
| **1. Identity** | ☁️ Cloud (Firebase) | Firebase Authentication | email, password hash, `displayName`, `uid`, `metadata` | ✅ Yes — survives reinstall, works on any device | `firebaseConfig.ts:15`; written `app/register.tsx:82-91`; read `app/_layout.tsx:29`, `app/(tabs)/index.tsx:63-72` |
| **2. Content** | 📱 The student's phone | AsyncStorage (SQLite-backed key/value) | notes[], study sessions[] | ⚠️ Yes, but **only on that device** — lost on uninstall / clear-data / new phone | `package.json:16`; 5 call sites listed in §2.2 |
| **3. Screen state** | 🧠 RAM (React) | `useState` | chat messages, current quiz, score, picked PDF, summary text | ❌ No — gone when you leave the screen | `app/ai-chat.tsx:27-36`; `app/quiz.tsx:32-43`; `app/pdf-summary.tsx:26-28` |
| **4. Upload buffer** | 🧠 RAM (Node) | `multer.memoryStorage()` | the uploaded PDF bytes, base64-encoded | ❌ No — **never written to disk**, freed after the response | `backend/server.js:21-26` (`storage: multer.memoryStorage()`), `:259-260` (`req.file.buffer.toString("base64")`) |

### 2.2 Every persistent write/read in the whole app — there are only **5**

| # | Operation | Key | File:line |
|---|---|---|---|
| 1 | **write** notes | `@studymate_notes_<uid>` | `app/notes.tsx:110-113` |
| 2 | **read** notes | `@studymate_notes_<uid>` | `app/notes.tsx:91` |
| 3 | **write** sessions | `studymate_study_sessions_<uid>` | `app/study-planner.tsx:121-124` |
| 4 | **read** sessions (planner) | `studymate_study_sessions_<uid>` | `app/study-planner.tsx:84` |
| 5 | **read** sessions (dashboard) | `studymate_study_sessions_<uid>` | `app/(tabs)/index.tsx:87` |

Key templates are built at `app/notes.tsx:90` & `:109`, `app/study-planner.tsx:76`, `app/(tabs)/index.tsx:86`.
There is **no** `removeItem` and **no** `clear` anywhere — deleting a note/session is done by rewriting the array without it (`app/notes.tsx:194`, `app/study-planner.tsx:250-253`).

### 2.3 What the stored data actually looks like

**Key** `@studymate_notes_<uid>` → a JSON array of `Note` (type at `app/notes.tsx:20-24`):
```json
[
  { "id": "1767225600000", "title": "Chapter 3 — Trees", "content": "BST, AVL, rotations…" },
  { "id": "1767225540000", "title": "Formula sheet",      "content": "O(log n) search…" }
]
```
- `id` = `Date.now().toString()` (`app/notes.tsx:149`) — a millisecond timestamp string
- newest first (`app/notes.tsx:154` → `[newNote, ...notes]`)
- the **whole array is rewritten** on every create/edit/delete (`app/notes.tsx:104-118`)

**Key** `studymate_study_sessions_<uid>` → a JSON array of `StudySession` (type at `app/study-planner.tsx:22-28`, duplicated at `app/(tabs)/index.tsx:35-41`):
```json
[
  { "id": "1767225600000", "subject": "Data Structures", "date": "30 August 2026",
    "duration": "2 hours", "completed": false }
]
```
- `id` = `Date.now().toString()` (`app/study-planner.tsx:175`)
- `date` and `duration` are **free text typed by the user** (`app/study-planner.tsx:451-457`, `:463-469`) — never parsed or validated. This is why "Today's Progress" on the dashboard is really *all-time* progress (`CODE_MAP.md` §13.10)
- newest first (`app/study-planner.tsx:182-185`)

### 2.4 The `uid` is the join key — how "user-specific storage" actually works

```
Firebase (cloud)                        Phone (AsyncStorage)
────────────────                        ────────────────────
register.tsx:82-86  create account
        │
        └──► user.uid  ─────────────┬──► notes.tsx:71 / :50      setUserId(uid)
                                    │           │
                                    │           └──► notes.tsx:90,109  "@studymate_notes_" + uid
                                    │
                                    ├──► study-planner.tsx:50    setUserId(uid)
                                    │           │
                                    │           └──► study-planner.tsx:76  "studymate_study_sessions_" + uid
                                    │
                                    └──► (tabs)/index.tsx:70     setUserId(uid)
                                                │
                                                └──► (tabs)/index.tsx:86  same literal key (duplicated!)
```

**Consequences of this design:**

| Situation | What happens | Why |
|---|---|---|
| Two accounts on the same phone | Each sees only their own notes/sessions | Different `uid` ⇒ different storage key |
| Same account on a new phone | Identity restored, **notes and sessions are empty** | AsyncStorage is device-local; nothing syncs |
| App uninstalled / data cleared | Notes and sessions **permanently lost** | Layer 2 destroyed |
| Sign out | On-screen data cleared (`app/notes.tsx:54-55`, `app/study-planner.tsx:52-53`) but storage rows remain | Only React state is reset |
| Sign back in | Everything reappears | Same `uid` ⇒ same keys |
| Signed-out visitor opens Notes | Can write into a shared `@studymate_notes_guest_user` bucket | Fallback `userId \|\| "guest_user"` at `app/notes.tsx:121`, `:193` — see `CODE_MAP.md` §13.8 |

### 2.5 Data that is deliberately **not** stored

| Data | Lives only in | Lost when | Line |
|---|---|---|---|
| AI chat conversation | `messages` state (seeded with one greeting) | you leave `/ai-chat`; also on app restart | `app/ai-chat.tsx:30-36` |
| Generated quiz + your answers + score | `quiz`, `currentQuestion`, `selectedAnswer`, `score`, `showResult` | you leave `/quiz` or tap "Create New Quiz" | `app/quiz.tsx:37-43`, reset `:129-135` |
| Picked PDF file + its summary | `file`, `summary` | you leave `/pdf-summary` | `app/pdf-summary.tsx:26-28` |
| The uploaded PDF bytes on the server | multer memory buffer | the HTTP response finishes | `backend/server.js:21-26` |
| Any prompt/response log | nowhere (console only) | the server process restarts | `backend/server.js:124`, `:391-394` |

**No student content is ever sent to Firebase, and no AI conversation is ever saved.** If your report claims "chat history is stored", that is inaccurate — see `PROJECT_INTRO.md` §3.

---

## Part 3 — How the AI is connected to the rest of the app

### 3.1 The connection map (3 features → 3 endpoints → 1 model)

| Feature | Screen component | `fetch()` call | Express route | Gemini call | Shared helper |
|---|---|---|---|---|---|
| **AI Chat** | `app/ai-chat.tsx:23` | `:59-67` → `POST /chat` | `backend/server.js:114-238` | `generateContentStream` `:157-161` | own retry loop `:151-201` |
| **PDF Summary** | `app/pdf-summary.tsx:23` | `:99-102` → `POST /summarize-pdf` | `backend/server.js:243-317` | `generateContent` via helper `:298-299` | `generateWithRetry` `:51-100` |
| **AI Quiz** | `app/quiz.tsx:29` | `:63-73` → `POST /generate-quiz` | `backend/server.js:322-519` | `generateContent` via helper `:396-397` | `generateWithRetry` `:51-100` |
| *(health check)* | — | `curl /` | `backend/server.js:105-109` | — | — |

Shared plumbing, used by all three:
- Express app + port: `backend/server.js:9-10`, listening on **`0.0.0.0`** at `:524-531`
- `cors()` open to any origin: `:15` · JSON body parsing: `:16`
- **one** Gemini client: `:39-41` · **one** model constant: `:46`
- **one** retry/backoff helper: `:51-100` (retries only on 429/500/502/503/504 `:76-81`, exponential delay `2^attempt` seconds `:87-95`)

### 3.2 Network addressing — why `10.0.2.2`

| You run the app on | Host in the `fetch()` URLs | Note |
|---|---|---|
| Android **emulator** | `http://10.0.2.2:3000` ✅ as coded | `10.0.2.2` is the emulator's alias for the *host PC's* `localhost` — explained in the code comment at `app/pdf-summary.tsx:89-97` |
| **Physical** Android device | must be changed to your PC's LAN IP, e.g. `http://192.168.1.20:3000` | Server already binds `0.0.0.0` (`backend/server.js:524`); open firewall port 3000; same Wi-Fi |
| iOS simulator | `http://localhost:3000` | |
| Web browser | `http://localhost:3000` | CORS already open (`backend/server.js:15`) |

The URL is duplicated in **three** files (`app/ai-chat.tsx:59`, `app/quiz.tsx:63`, `app/pdf-summary.tsx:99`) — see `CODE_MAP.md` §13.12 for the one-line `API_BASE` refactor.

### 3.3 Full trace — AI Chat (the streaming one)

```
USER taps ↑                                   app/ai-chat.tsx:291
  ▼
sendMessage()                                 app/ai-chat.tsx:41-126
  ├─ trim + guard (:42-46)
  ├─ append USER bubble to state (:48-54)      → visible immediately via renderMessage (:131-170)
  ├─ clear input (:55), setLoading(true) (:56) → "Thinking…" dots (:240-256)
  ├─ fetch POST http://10.0.2.2:3000/chat      (:59-67)  body {message}
  │        ▼
  │   app.post("/chat")                        backend/server.js:114
  │   ├─ validate message → 400 if empty       :116-122
  │   ├─ streaming headers text/plain,         :127-142
  │   │  no-cache, keep-alive + flushHeaders()
  │   ├─ retry loop, up to 5 attempts          :151-201
  │   │    ai.models.generateContentStream({   :157-161
  │   │        model: "gemini-3.6-flash",      (:46)
  │   │        contents: message.trim() })
  │   ├─ for await (chunk of stream)           :211-217
  │   │      res.write(chunk.text)             :214-216
  │   └─ res.end()                             :219
  │        ▼
  ├─ await response.text()                     app/ai-chat.tsx:72
  │      ⚠️ buffers the ENTIRE stream before returning — so the bubble appears all at once,
  │         there is no typewriter effect (see CODE_MAP.md §13.13)
  ├─ !response.ok → throw                      :77-81
  ├─ accept JSON {reply} / {message} OR plain  :83-99   (defensive: works with either shape)
  ├─ empty reply → throw                       :101-103
  ├─ append AI bubble                          :105-111
  ├─ catch → friendly error bubble             :112-122  "…make sure the backend is running on port 3000"
  └─ finally setLoading(false)                 :123-125
```

### 3.4 Full trace — AI Quiz (the structured-JSON one)

```
generateQuiz()        app/quiz.tsx:49-91   ──POST {topic, numberOfQuestions, difficulty}──►  server.js:322
  ├─ topic guard :50-53                                                       ├─ defaults 5 / "medium"   :324-328
  ├─ reset all quiz state :55-60                                              ├─ topic guard → 400         :330-334
  ├─ fetch :63-73                                                             ├─ clamp count to 1..20      :336-342
  ├─ data = await response.json() :75                                         ├─ prompt with an EXACT JSON :344-389
  ├─ !ok → throw data.error :77-79                                            │   schema + "correctAnswer is
  ├─ setQuiz(data) :81  ⇒ setup form hides (:166),                            │   a ZERO-BASED index" :377-383
  │                    question view shows (:282)                             ├─ generateWithRetry(prompt)  :396-397 → :51-100
  └─ catch → Alert :82-87                                                     ├─ strip ```json fences       :399-415
                                                                              ├─ JSON.parse → 500 on fail   :419-436
PLAY LOOP                                                                     ├─ VALIDATE                   :442-505
selectAnswer(i)  app/quiz.tsx:97-108                                          │   • questions is an array    :442-450
  ├─ lock if already answered :98                                             │   • length === requested     :452-459
  ├─ setSelectedAnswer(i) :103                                                │   • 4 options, integer       :461-479
  └─ if i === question.correctAnswer → score+1 :105-107                       │     answer index 0..3
     ⇒ green + ✓ (:326-330,:354-358) / red + ✕ (:331-335,:360-364)            │   • every option non-blank   :482-492
     ⇒ explanation revealed (:371-381), options locked (:343)                 │   • explanation, if present,  :495-504
nextQuestion()   :114-123  → last question ⇒ setShowResult(true) :121         │     is a string
restartQuiz()    :129-135  → wipes everything, back to the setup form         └─ res.json(quiz)             :507
                                                                                  catch → 503                 :508-518
```
**The `correctAnswer` index contract spans both tiers** — defined in the prompt (`server.js:377-383`), enforced server-side (`:468-474`), then consumed by the app for scoring (`app/quiz.tsx:105`), for `isCorrect` (`:320`) and for the green/red styling (`:327`, `:331`, `:354`, `:360`). Change one and you must change all.

### 3.5 Full trace — PDF Summary (the file-upload one)

```
pickPDF()           app/pdf-summary.tsx:34-65
  └─ DocumentPicker.getDocumentAsync({type:"application/pdf", copyToCacheDirectory:true})   :36-39
     → setFile({name, uri, size, mimeType}) :47-52  → upload box flips to "Change Selected PDF" :192-198
summarizePDF()      app/pdf-summary.tsx:71-121
  ├─ guard !file :72-75 ; setLoading(true) :77 → button spinner :234-238
  ├─ FormData + append("pdf", {uri, name, type}) :81-87        ← field name MUST be "pdf"
  ├─ fetch POST (no Content-Type header — RN sets the multipart boundary) :99-102
  │        ▼                                                    backend/server.js:243-246
  │   upload.single("pdf")  ← binds the field name              :245  (multer config :21-26, 10 MB cap :23-25)
  │   ├─ !req.file → 400                                        :248-252
  │   ├─ base64PDF = req.file.buffer.toString("base64")         :259-260   ← RAM only, never on disk
  │   ├─ 6-section study prompt                                 :262-279
  │   ├─ contents = [{role:"user", parts:[
  │   │      {inlineData:{mimeType:"application/pdf", data: base64PDF}},   :286-290
  │   │      {text: prompt}]}]                                             :291-293
  │   ├─ generateWithRetry(contents)                            :298-299 → :51-100
  │   └─ res.json({ fileName, summary: response.text })         :301-304
  │        ▼
  ├─ data = await response.json() :104 ; !ok → throw data.error :106-108
  ├─ setSummary(data.summary) :110  → summary card renders :248-259
  └─ catch → Alert :111-117 ; finally setLoading(false) :118-120
```

### 3.6 🔑 The most important architectural fact: **the AI is not connected to accounts or data at all**

| Question | Answer | Evidence |
|---|---|---|
| Does the backend know which student is calling? | **No.** No `uid`, no ID token, no header is sent with any AI request. | request bodies: `app/ai-chat.tsx:64-66`, `app/quiz.tsx:68-72`; server destructuring `backend/server.js:116`, `:324-328` |
| Do the AI screens import Firebase? | **No.** `app/ai-chat.tsx`, `app/quiz.tsx`, `app/pdf-summary.tsx` contain zero Firebase imports. | grep: `firebaseConfig` is imported by only 6 files — `_layout`, `login`, `register`, `(tabs)/index`, `notes`, `study-planner` |
| Are AI screens protected by the login guard? | **No.** The guard only covers `(tabs)` and `index`. | `app/_layout.tsx:44-66` |
| Are AI results saved to Notes or the planner? | **No.** There is no "save this summary as a note" or "add this quiz to my plan" path anywhere. | no cross-imports between those files |
| Is the AI rate-limited per user? | **No.** Only Gemini's own 429s, absorbed by the retry loop. | `backend/server.js:76-81`, `:177-182` |
| Does chat have memory of previous turns? | **No.** Each request sends only the newest message; no history array is transmitted. | `backend/server.js:160` — `contents: message.trim()` (a single string) |

**So the AI layer is stateless, anonymous and side-effect-free.** It touches the rest of the app in exactly one way: the dashboard's cards navigate to it (`app/(tabs)/index.tsx:404`, `:451`, `:499`) and its `‹` buttons navigate back (`app/ai-chat.tsx:191`, `app/pdf-summary.tsx:149`, `app/quiz.tsx:147`).

```
                    ┌──────────── AUTH + DATA WORLD ────────────┐   ┌──── AI WORLD ────┐
                    │                                            │   │                  │
   Firebase Auth ◄──┤ _layout (guard) · login · register         │   │  ai-chat         │
        │           │ dashboard (name, initials, progress,       │   │  quiz            │
        │ uid       │           sign-out)                        │   │  pdf-summary     │
        ▼           │ notes      ⇄ AsyncStorage                  │   │        │         │
   AsyncStorage ◄───┤ planner    ⇄ AsyncStorage                  │   │        │ fetch   │
                    └──────────────────────┬─────────────────────┘   └────────┼─────────┘
                                           │                                  │
                                           │  ONLY connection: router.push    │
                                           └── (tabs)/index.tsx:404,451,499 ──┘
                                              and router.back() on ‹
```

### 3.7 Failure behaviour — what the student sees when AI is down

| Failure | Backend response | What appears in the app |
|---|---|---|
| Backend not running / wrong host | connection refused | Chat: AI bubble "Sorry, I couldn't connect to the AI server… port 3000" (`app/ai-chat.tsx:115-122`). Quiz: Alert "Could not connect to the AI server…" (`app/quiz.tsx:84-87`). PDF: Alert "Summary Error" (`app/pdf-summary.tsx:114-117`) |
| Empty message / empty topic / no PDF | `400` + `{error}` (`server.js:118-122`, `:330-334`, `:248-252`) | Chat: guard blocks before sending (`app/ai-chat.tsx:44-46`). Quiz/PDF: client-side guards fire first (`app/quiz.tsx:50-53`, `app/pdf-summary.tsx:72-75`) |
| Gemini returns malformed quiz JSON | `500` + `{error}` (`server.js:432-435`) | Quiz Alert via `data.error` (`app/quiz.tsx:78`) |
| Gemini rate-limit / 5xx after all retries | `503` + `{error}` (`server.js:228-231`, `:311-314`, `:514-517`) | same Alert paths |
| PDF over 10 MB | multer rejects (`server.js:23-25`) | PDF Alert (`app/pdf-summary.tsx:114-117`) |
| Gemini fails *mid-stream* (chat) | headers already sent ⇒ just `res.end()` (`server.js:234-236`) | Truncated/empty reply ⇒ "AI returned an empty response." (`app/ai-chat.tsx:101-103`) → error bubble |

### 3.8 If you want to *actually* connect the AI to accounts (optional upgrades)

1. **Send identity:** after `signInWithEmailAndPassword`, get `await currentUser.getIdToken()` and send it as `Authorization: Bearer <token>` from `app/ai-chat.tsx:61-63`; verify it server-side with the Firebase Admin SDK in a middleware before `backend/server.js:116`. That enables per-user limits and audit logs.
2. **Persist chat history:** write `messages` to AsyncStorage under `@studymate_chat_${uid}` inside a `useFocusEffect`, mirroring the notes pattern at `app/notes.tsx:44-118`.
3. **Send conversation context:** change `contents: message.trim()` (`backend/server.js:160`) to an array of prior turns so the AI remembers the conversation.
4. **"Save as note" buttons:** on the summary card (`app/pdf-summary.tsx:248-259`) and the quiz result (`app/quiz.tsx:404-437`), call the same writer the notes screen uses (`app/notes.tsx:104-118`) — extract it to a shared `lib/notes.ts` first.
5. **Centralise the URL:** one `API_BASE` constant (`CODE_MAP.md` §13.12).

---

## One-paragraph answer

The project uses **two unrelated keys**: the Firebase *web* key is hard-coded in the app at `firebaseConfig.ts:5` (it is a project identifier, not a real secret), while the **Gemini key exists only in `backend/.env`**, is loaded by `dotenv.config()` (`backend/server.js:7`), is guarded at boot — the server calls `process.exit(1)` if it is missing (`:31-34`) — and is injected exactly once into a single `GoogleGenAI` client (`:39-41`) that all three AI routes share, together with one model constant `gemini-3.6-flash` (`:46`) and one retry/backoff helper (`:51-100`). The phone never sees that key: it only calls `http://10.0.2.2:3000` (`app/ai-chat.tsx:59`, `app/quiz.tsx:63`, `app/pdf-summary.tsx:99`). **There is no database** — Firebase provides *Authentication only*, and all student content lives in on-device **AsyncStorage** through just five calls (`app/notes.tsx:91,110`; `app/study-planner.tsx:84,121`; `app/(tabs)/index.tsx:87`), stored as JSON arrays under keys suffixed with the Firebase **`uid`** (`@studymate_notes_<uid>`, `studymate_study_sessions_<uid>`), which is the entire mechanism behind per-user isolation; chat history, quiz results, PDF summaries and the uploaded PDF bytes are all RAM-only and vanish on navigation. The **AI is connected to the rest of the app only through navigation** — dashboard cards push the three AI screens (`app/(tabs)/index.tsx:404,451,499`) and their `‹` buttons pop back — because those screens import no Firebase, send no `uid`, and save nothing, making the AI layer stateless, anonymous and side-effect-free.
