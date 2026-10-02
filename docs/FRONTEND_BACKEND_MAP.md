# StudyMate AI — Every Function: Frontend ↔ Backend, Simply

> Plain-language map of **what each function does**, **which frontend code runs it**,
> and **which backend (if any) it talks to** — with exact `file:line` for every step.
> Source at commit `5ea6dc1`. Deep detail lives in [`CODE_MAP.md`](./CODE_MAP.md).

---

## ⭐ The one thing to understand first

**Only 3 of the app's 17 functions touch your Node.js backend.** The others talk to
Firebase (cloud) or to the phone's own storage. There are **three** "back ends":

```
                       ┌──────────────────────────────────────────────┐
   📱 THE APP          │  A. Firebase Auth  (cloud, Google's servers)  │ ← account functions
   app/**  ────────────┤  B. AsyncStorage   (the phone itself)         │ ← notes + planner
                       │  C. Node + Gemini  (backend/server.js :3000)  │ ← the 3 AI functions
                       └──────────────────────────────────────────────┘
```

| Group | Functions | Talks to | Your code on the other side |
|---|---|---|---|
| **A. Account** | register, login, forgot password, logout, show name, screen lock | ☁️ Firebase Auth | *none — Google's servers* |
| **B. Data** | create/edit/delete/search notes, add/complete/delete sessions, dashboard progress | 📱 AsyncStorage | *none — the phone* |
| **C. AI** | chat, PDF summary, quiz | 🖥 Node → 🤖 Gemini | `backend/server.js` |
| **D. Navigation** | move between screens | 🧠 in-app only | *none* |

---

# GROUP A — Account functions (Frontend ↔ Firebase cloud)

> **Backend involved:** Firebase Authentication (`firebaseConfig.ts:15` exports the one shared `auth`).
> **Your Node server is NOT involved in any of these.**

### A1. Create an account (Register)
**User does:** types Full Name, Email, Password, Confirm Password → taps **Create Account**.

| | |
|---|---|
| Button | `app/register.tsx:278-302` → `onPress={handleRegister}` `:283` |
| Function | `app/register.tsx:54-116` |
| Backend call | `createUserWithEmailAndPassword(auth, email, password)` → `app/register.tsx:82-86` |

```
button :283
  → handleRegister() :54
  → checks: empty? :56-64 · passwords match? :67-70 · 6+ chars? :73-76
  → 🔥 FIREBASE: create account :82-86
  → 🔥 FIREBASE: save the name (displayName) :89-91
  → 🔥 FIREBASE: sign out immediately :94      (so they must log in themselves)
  → alert "Account created successfully!" :97
  → router.replace("/login") :100
```

### A2. Log in
**User does:** types email + password → taps **Login**.

| | |
|---|---|
| Button | `app/login.tsx:212-226` → `onPress={handleLogin}` `:214` |
| Function | `app/login.tsx:50-84` |
| Backend call | `signInWithEmailAndPassword(auth, email, password)` → `app/login.tsx:59-63` |

```
button :214 → handleLogin() :50
  → empty check :51-54 → spinner on :56
  → 🔥 FIREBASE: sign in :59-63
  → alert "Login successful!" :65
  → router.replace("/(tabs)") :66   ← lands on the Home Dashboard
  → wrong password / no account / bad email → friendly messages :70-79
```
**Side effect:** signing in fires the listener at `app/_layout.tsx:29-35` → the dashboard then reads your name (`app/(tabs)/index.tsx:63-72`).

### A3. Forgot password
**User does:** types their email → taps **Forgot Password?**

| | |
|---|---|
| Link | `app/login.tsx:203-209` → `onPress={handleForgotPassword}` `:205` |
| Function | `app/login.tsx:87-113` |
| Backend call | `sendPasswordResetEmail(auth, email)` → `app/login.tsx:94-97` |

```
link :205 → handleForgotPassword() :87
  → email empty? alert :88-91
  → 🔥 FIREBASE: send reset email :94-97
  → alert "Password reset email sent!" :99-101
  → (no navigation — the user stays on the login screen)
  → the actual password change happens on Firebase's own web page, opened from the email
```

### A4. Log out (Sign Out)
**User does:** taps the red **Sign Out** button on the dashboard → confirms.

| | |
|---|---|
| Button | `app/(tabs)/index.tsx:263-277` → `onPress={handleSignOut}` `:265` |
| Function | `app/(tabs)/index.tsx:121-153` |
| Backend call | `signOut(auth)` → `app/(tabs)/index.tsx:135` |

```
button :265 → handleSignOut() :121
  → confirm dialog :122-152  ("Cancel" :126-129 aborts)
  → 🔥 FIREBASE: signOut(auth) :135
  → router.replace("/login") :137
  → ALSO: app/_layout.tsx:29-35 hears about it → guard :53-56 would send them
          to /login anyway (two safety nets)
  → notes/planner data on the phone is NOT deleted — it returns on next login
```

### A5. Show the user's name and initials
**User sees:** "Hello, Rahim!" and an avatar with "R".

```
🔥 FIREBASE gives displayName
  → app/(tabs)/index.tsx:63-72 reads it (:66-67), fallback "Student"
  → setUserName :69
  → printed as "Hello, {userName}!" :241-243
  → getInitials() :189-205  (1 name → 1 letter :195-199 · 2+ names → first + last :201-204)
  → drawn inside the avatar circle :253-257 (value injected at :255)
```
| Piece | Line |
|---|---|
| Name is *written* | `app/register.tsx:89-91` |
| Name is *read* | `app/(tabs)/index.tsx:66-67` |
| Initials logic | `app/(tabs)/index.tsx:189-205` |

### A6. Lock the screens (authentication protection)
**What happens:** a logged-out user cannot stay on the Home Dashboard.

| | |
|---|---|
| Listener | `app/_layout.tsx:28-38` (`onAuthStateChanged` → `setUser` `:32`, `setLoading(false)` `:33`) |
| Guard | `app/_layout.tsx:41-79` |
| Loading gate | `app/_layout.tsx:82-98` (spinner until Firebase answers) |

```
every time auth or the route changes:
  → wait while loading :42
  → which screen am I on? :44-47
  → RULE 1: logged OUT and on (tabs)  → replace("/login")   :53-56
  → RULE 2: logged IN  and on welcome → replace("/(tabs)")  :63-66
  → RULE 3: login/register are never auto-moved — they navigate themselves :68-78
```
⚠️ The guard covers only `(tabs)` and the welcome screen. `/study-planner` protects itself (`app/study-planner.tsx:304-335`); `/notes`, `/ai-chat`, `/quiz`, `/pdf-summary` are not guarded.

---

# GROUP B — Data functions (Frontend ↔ the phone's storage)

> **Backend involved:** none. No Firebase, no Node server. Data is saved on the device with
> AsyncStorage, under a key that contains the Firebase **uid** — that is what makes it private per user.

```
uid comes from 🔥 Firebase  →  key = "prefix" + uid  →  📱 AsyncStorage on the phone
   notes:     "@studymate_notes_<uid>"              app/notes.tsx:90 and :109
   planner:   "studymate_study_sessions_<uid>"       app/study-planner.tsx:76
```

### B1. Load my notes when I open the screen
```
screen focused → useFocusEffect app/notes.tsx:44-61
  → initNotes() :63-86 → read uid from Firebase :68-71
  → loadNotesForUser(uid) :88-102
  → 📱 AsyncStorage.getItem("@studymate_notes_<uid>") :90-91
  → JSON.parse :94 → setNotes → list is drawn :381-415
  → not logged in? clear everything :75-77 (never show another account's notes)
```

### B2. Create a note
| | |
|---|---|
| Two ways to open the editor | `+` button `app/notes.tsx:244-255` · "Create First Note" `:349-357` |
| Editor card | `app/notes.tsx:283-327` |
| Save button | `:316-324` → `onPress={saveNote}` `:318` |
| Function | `app/notes.tsx:120-171` |

```
Save :318 → saveNote() :120
  → title empty? alert :125-128 · content empty? alert :130-133
  → editingNoteId is null ⇒ CREATE branch :147-155
  → new id = Date.now() :149 → put newest first :154
  → update the screen :157
  → 📱 saveNotesToStorage() :158 → :104-118 → AsyncStorage.setItem :110-113
  → clear the form and close the editor :160-163 → alert "Note Saved" :165-170
```

### B3. Edit a note
```
✏️ on a note card :398-404 → editNote(note) :173-178
  → fills the form :174-175 → remembers which note :176 → opens the editor :177
  → heading switches to "Edit Note" :286, button to "Update" :322
Save → the SAME saveNote() :120, but editingNoteId is set ⇒ EDIT branch :137-146
  → notes.map(...) replaces only that one note :138-146
  → 📱 saved the same way :158 → alert "Note Updated" :165-170
```
👉 Create and Edit share **one** function; the fork is the single line `app/notes.tsx:137`.

### B4. Delete a note
```
🗑️ on a note card :406-412 → deleteNote(id) :180-202
  → confirm dialog :181-201
  → notes.filter(remove that id) :194 → update screen :196
  → 📱 save the shorter array :197 → the card just disappears
```

### B5. Search notes
```
type in the search box :262-281 → searchText :30
  → filteredNotes :211-218 (matches title OR content, case-insensitive)
  → the list re-renders :381-415 · the count updates :375-378
  → nothing matched? "No Notes Found" :361-369
```
*No backend — it filters the array already in memory.*

### B6. Add a study session
| | |
|---|---|
| Form (Subject / Date / Duration) | `app/study-planner.tsx:434-484` |
| Add button | `:471-483` → `onPress={addSession}` `:473` |
| Function | `app/study-planner.tsx:141-197` |

```
Add :473 → addSession() :141
  → not logged in? alert :142-148
  → subject / date / duration missing? alerts :150-172
  → build the session with completed:false :174-180 (id = Date.now() :175)
  → newest first :182-185
  → 📱 saveSessions() :187 → :107-135 → AsyncStorage.setItem :121-124 → update screen :126
  → clear the 3 inputs :189-191 → alert "Success" :193-196
```

### B7. Mark a session Done / Undo
```
"Done" or "Undo" button :544-560 → toggleComplete(id) :203-223
  → flip completed for that one session :212-220
  → 📱 save :222
  → the card recolours :504-515, emoji becomes ✅ :517-519, progress card updates :410-426
```

### B8. Delete a study session
```
🗑️ :562-576 → deleteSession(id) :229-260
  → confirm dialog :238-259 → filter it out :250-253 → 📱 save :255
```

### B9. Dashboard progress (the frontend↔frontend correlation that matters most)
**User sees:** "Today's Progress 60%", a bar, "3 completed / 2 remaining", and 3 stat tiles.

```
📱 the planner WROTE  "studymate_study_sessions_<uid>"   app/study-planner.tsx:121-124
                                   │
      user taps ‹ back (:361) ─────┘
                                   ▼
   dashboard regains focus → useFocusEffect app/(tabs)/index.tsx:108-116
   → loadStudySessions(uid) :80-106
   → 📱 AsyncStorage.getItem(SAME key) :86-87 → JSON.parse :90 → setSessions :92
   → maths :170-184   total :170 · completed :172-174 · remaining :176-177 · % :179-184
   → drawn at:  % circle :346-350 · bar width :358 · "N completed / N remaining" :364-372
                stat tiles :649-721 (Total :666, Completed :690, Remaining :714)
```
🔑 **The two files never import each other.** They are connected only by using the **same storage key string** — `app/study-planner.tsx:76` and `app/(tabs)/index.tsx:86`. `useFocusEffect` is what makes it refresh on return.
⚠️ "Today's Progress" actually counts **all** sessions — the `date` field is free text and is never compared to today's date.

---

# GROUP C — AI functions (Frontend ↔ Node backend ↔ Gemini)

> **This is the only group with a real backend.** All three call `http://10.0.2.2:3000`
> (`10.0.2.2` = the Android emulator's name for your PC's localhost).
> Server: `backend/server.js`, listening at `:524`. Gemini key: `backend/.env` → `:40`.

### C1. AI Chat — ask a question
| | Frontend | Backend |
|---|---|---|
| Send button | `app/ai-chat.tsx:284-303` (`onPress` `:291`) | |
| Function | `app/ai-chat.tsx:41-126` | |
| Request | `fetch("http://10.0.2.2:3000/chat")` `:59-67` | `app.post("/chat")` `backend/server.js:114-238` |
| AI call | | `generateContentStream` `:157-161` (model `:46`) |

```
type a message :270-282 → tap ↑ :291 → sendMessage() :41
  → my bubble appears instantly :48-54 → input cleared :55 → "Thinking…" dots :240-256
  → 🌐 POST /chat :59-67  body {message}
        → 🖥 server.js:114 → check :116-122 → stream headers :127-142
        → 🤖 Gemini generateContentStream :157-161  (retries on 429/5xx :151-201)
        → 🖥 writes each chunk back :211-217 → res.end() :219
  → 🌐 response.text() :72   ⚠️ waits for the WHOLE stream, so no typing animation
  → accepts JSON {reply}/{message} OR plain text :83-99
  → empty? error :101-103 → AI bubble appended :105-111 → dots removed :123-125
  → server unreachable? friendly bubble "…make sure the backend is running on port 3000" :112-122
```

### C2. PDF Summary — upload a PDF, get a summary
| | Frontend | Backend |
|---|---|---|
| Pick a PDF | `app/pdf-summary.tsx:183-199` → `pickPDF()` `:34-65` (`DocumentPicker` `:36-39`) | |
| Summarize button | `:225-245` → `summarizePDF()` `:71-121` | |
| Request | `fetch("http://10.0.2.2:3000/summarize-pdf")` `:99-102` | `app.post("/summarize-pdf", upload.single("pdf"))` `backend/server.js:243-317` |
| AI call | | `generateWithRetry` `:298-299` → `:51-100` |

```
tap the upload box :185 → pickPDF() :34
  → 📂 phone file picker :36-39 → save {name, uri, size} :47-52 → box shows the file name :192-198
tap ✨ Summarize :230 → summarizePDF() :71
  → no file? alert :72-75 → spinner :77
  → FormData field named "pdf" :81-87      ← the name must match server.js:245
  → 🌐 POST /summarize-pdf :99-102
        → 🖥 server.js:243 → multer keeps it IN MEMORY, 10 MB max :21-26
        → 🖥 no file? 400 :248-252 → convert to base64 :259-260
        → 🖥 build the 6-section study prompt :262-279
        → 🤖 Gemini with the PDF attached as inlineData :281-299
        → 🖥 reply {fileName, summary} :301-304
  → 🌐 setSummary(data.summary) :110 → summary card is drawn :248-259
  → server down? alert "Summary Error" :111-117
```
⚠️ The PDF is **never written to disk** — it lives in server RAM only for that one request.

### C3. AI Quiz — generate, answer, score
| | Frontend | Backend |
|---|---|---|
| Generate button | `app/quiz.tsx:253-260` → `generateQuiz()` `:49-91` | |
| Request | `fetch("http://10.0.2.2:3000/generate-quiz")` `:63-73` | `app.post("/generate-quiz")` `backend/server.js:322-519` |
| AI call | | `generateWithRetry(prompt)` `:396-397` |

```
STEP 1 — set up:  topic :180-190 · how many questions 5/10/15 :193-220
                  difficulty easy/medium/hard :223-250
STEP 2 — tap ✨ Generate Quiz :255 → generateQuiz() :49
  → no topic? alert :50-53 → reset everything :55-60
  → 🌐 POST /generate-quiz :63-73  body {topic, numberOfQuestions, difficulty}
        → 🖥 server.js:322 → defaults 5/"medium" :324-328 → no topic? 400 :330-334
        → 🖥 clamp the count to 1..20 :336-342
        → 🖥 prompt demanding EXACT JSON, "correctAnswer = zero-based index" :344-389
        → 🤖 Gemini :396-397
        → 🖥 strip ```json fences :399-415 → JSON.parse :419-420 (bad JSON → 500 :432-435)
        → 🖥 VALIDATE: right number of questions :452-459 · exactly 4 options :466-467
                     · answer is a whole number 0-3 :468-474 · options are real text :482-492
        → 🖥 send the clean quiz :507
  → 🌐 setQuiz(data) :81 → setup form hides :166, question screen appears :282
STEP 3 — answer: tap an option :342 → selectAnswer(i) :97-108
  → already answered? ignore :98 → remember the choice :103
  → i === question.correctAnswer ? score + 1 :105-107      ← the contract from server.js:377-383
  → correct turns GREEN + ✓ :326-330,:354-358 · wrong turns RED + ✕ :331-335,:360-364
  → options lock :343 → 💡 explanation appears :371-381 → Next button appears :384-397
STEP 4 — move on: Next :387 → nextQuestion() :114-123
  → more questions? index +1 and clear the choice :117-119
  → last one? show the result screen :120-122
STEP 5 — result: 🏆 card :404-437 → score "X / Y" :417-419 → accuracy % :421-425
  → 🔄 "Create New Quiz" :430 → restartQuiz() :129-135 wipes everything → back to STEP 1
```
🔑 **The `correctAnswer` number is a contract between the two tiers:** defined in the backend prompt (`server.js:377-383`), enforced by backend validation (`:468-474`), then used by the frontend for scoring (`app/quiz.tsx:105`) and colouring (`:320`, `:327`, `:331`).

---

# GROUP D — Navigation (frontend only, no backend)

| # | User taps | Code | Goes to |
|---|---|---|---|
| D1 | "Get Started" | `app/index.tsx:96` | `/login` |
| D2 | "Register" link | `app/login.tsx:233` | `/register` |
| D3 | "Login" link | `app/register.tsx:309` | `/login` |
| D4 | AI Chat card | `app/(tabs)/index.tsx:404` | `/ai-chat` |
| D5 | PDF Summary card | `app/(tabs)/index.tsx:451` | `/pdf-summary` |
| D6 | AI Quiz card | `app/(tabs)/index.tsx:499` | `/quiz` |
| D7 | My Notes card | `app/(tabs)/index.tsx:546` | `/notes` |
| D8 | Study Planner banner | `app/(tabs)/index.tsx:596` | `/study-planner` |
| D9 | `‹` back on any feature screen | `app/ai-chat.tsx:191` · `app/notes.tsx:231` · `app/pdf-summary.tsx:149` · `app/quiz.tsx:147` · `app/study-planner.tsx:361` | back to the dashboard (which then refreshes its numbers — see B9) |
| D10 | Bottom tab bar | `app/(tabs)/_layout.tsx:13-33` | Home / Explore |

`push` = go forward (back works) · `replace` = go forward and delete the previous screen · `back` = return.

---

## 📋 One-page summary table

| Function | Frontend code | Backend it talks to | Backend code |
|---|---|---|---|
| Create account | `app/register.tsx:54-116` | ☁️ Firebase Auth | `createUserWithEmailAndPassword` `:82-86` |
| Save display name | `app/register.tsx:89-91` | ☁️ Firebase Auth | `updateProfile` |
| Log in | `app/login.tsx:50-84` | ☁️ Firebase Auth | `signInWithEmailAndPassword` `:59-63` |
| Forgot password | `app/login.tsx:87-113` | ☁️ Firebase Auth | `sendPasswordResetEmail` `:94-97` |
| Log out | `app/(tabs)/index.tsx:121-153` | ☁️ Firebase Auth | `signOut` `:135` |
| Show name + initials | `app/(tabs)/index.tsx:63-72`, `:189-205` | ☁️ Firebase Auth | `onAuthStateChanged` |
| Lock screens | `app/_layout.tsx:28-38`, `:41-79` | ☁️ Firebase Auth | `onAuthStateChanged` `:29` |
| Load notes | `app/notes.tsx:88-102` | 📱 AsyncStorage | — |
| Create note | `app/notes.tsx:120-171` (branch `:147-155`) | 📱 AsyncStorage | `:110-113` |
| Edit note | `app/notes.tsx:173-178` + `:137-146` | 📱 AsyncStorage | `:110-113` |
| Delete note | `app/notes.tsx:180-202` | 📱 AsyncStorage | `:197` |
| Search notes | `app/notes.tsx:211-218` | 🧠 memory only | — |
| Add session | `app/study-planner.tsx:141-197` | 📱 AsyncStorage | `:121-124` |
| Complete / Undo | `app/study-planner.tsx:203-223` | 📱 AsyncStorage | `:222` |
| Delete session | `app/study-planner.tsx:229-260` | 📱 AsyncStorage | `:255` |
| Dashboard progress | `app/(tabs)/index.tsx:108-116`, `:170-184` | 📱 AsyncStorage | `:86-92` |
| **AI Chat** | `app/ai-chat.tsx:41-126` | 🖥 Node → 🤖 Gemini | `backend/server.js:114-238` |
| **PDF Summary** | `app/pdf-summary.tsx:34-65`, `:71-121` | 🖥 Node → 🤖 Gemini | `backend/server.js:243-317` |
| **AI Quiz** | `app/quiz.tsx:49-91`, `:97-135` | 🖥 Node → 🤖 Gemini | `backend/server.js:322-519` |

**Backend shared by all three AI functions:** Gemini client `backend/server.js:39-41` · model `:46` · retry helper `:51-100` · CORS `:15` · JSON parsing `:16` · listening on port 3000 `:524` · API key check `:31-34`.

**Things that are NOT saved anywhere:** chat history (`app/ai-chat.tsx:30-36`), quiz and score (`app/quiz.tsx:37-43`), PDF summaries (`app/pdf-summary.tsx:26-28`) — all disappear when you leave the screen.
