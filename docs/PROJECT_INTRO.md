# StudyMate AI — Corrected Introduction Sections

> Both original drafts contained factual errors when checked against the repository.
> The corrected versions below are written **only** from what exists in git
> (source at commit `5ea6dc1`, branch `arena/01a0edfe-mate`). Every claim carries its evidence.
>
> Companion document: [`docs/CODE_MAP.md`](./CODE_MAP.md) — full file:line map of the whole app.

---

## 0. What was wrong in the two original sections

| # | Original claim | Reality in the repo | Evidence |
|---|---|---|---|
| 1 | *"developed using **Flutter**"* | **Expo SDK 54 + React Native 0.81.5 + React 19.1.0, written in TypeScript** (strict mode). There is no Dart code, no `pubspec.yaml`, no `lib/` folder, and the strings "flutter"/"dart" appear nowhere in the project. | `package.json:20,35,37,49`; `tsconfig.json:4`; entry `package.json:3` = `expo-router/entry` |
| 2 | *"developed using Flutter **and Firebase**"* (implying Firebase is the platform) | Firebase is used for **Authentication only** — email/password. There is **no Firestore, no Realtime Database, no Firebase Storage, no Cloud Functions, no Cloud Messaging** anywhere in the codebase. `firebaseConfig.ts` imports exactly two modules. | `firebaseConfig.ts:1-2,13,15`; `package.json:34` |
| 3 | Implies the AI comes from Firebase | The AI comes from a **separate Node.js / Express 5 REST backend** that calls **Google Gemini** (`@google/genai`), model `gemini-3.6-flash`, listening on port 3000. | `backend/package.json:9,12`; `backend/server.js:39-46,524` |
| 4 | Implies student data is stored in Firebase | Notes and study sessions are stored **on the device** in AsyncStorage, under keys scoped by the Firebase **uid**. Nothing syncs to the cloud. | `app/notes.tsx:90,109`; `app/study-planner.tsx:76,121-124`; `package.json:16` |
| 5 | *"note management"* (draft 1) — correct but incomplete | Notes support create, edit, delete **and live keyword search**, plus empty/loading/no-result states. | `app/notes.tsx:120-171,173-178,180-202,211-218` |
| 6 | *"track their study progress"* — correct but vague | Progress = completed vs. remaining sessions with a percentage, shown **twice**: on the planner and on the Home dashboard, which re-reads storage every time the screen regains focus. | `app/study-planner.tsx:266-275`; `app/(tabs)/index.tsx:170-184,108-116` |
| 7 | Missing entirely | Account security features: password reset email, display name, initials avatar, confirmation dialog on sign-out, and a **route guard** that blocks the dashboard for signed-out users. | `app/login.tsx:87-113`; `app/register.tsx:89-91`; `app/(tabs)/index.tsx:121-153,189-205`; `app/_layout.tsx:41-79` |
| 8 | Missing entirely | It is **cross-platform from one codebase** — Android, iOS and web — with a hand-built premium dark UI (glassmorphism, ambient glow, Poppins typeface), not a template. | `app.json:11-28`; `app/index.tsx:125-154`; `package.json:14` |

**Scale of the project (measured, not estimated):** 9 functional screens · ~6,669 lines of screen code · 531 lines of backend · ~7,784 lines total.

---

## 1. Section One — General Introduction

### 1.1 One-sentence version (for an abstract or tagline)

> StudyMate AI is a cross-platform mobile application that gives students an AI study companion, a PDF summariser, an automatic quiz generator, private note management and a study planner with progress tracking — all in one secure, account-based dark-themed app.

### 1.2 Standard version (recommended — replaces your first paragraph)

> **StudyMate AI** is a mobile study assistant that brings artificial intelligence and personal study organisation together in a single application. Students can ask academic questions in an AI chat, upload a PDF and receive a structured summary, generate topic-wise multiple-choice quizzes with instant scoring and explanations, create and maintain their own searchable notes, and plan study sessions while tracking how many are completed and how many remain. Every feature sits behind an email-and-password account, so each student's notes, study plan and progress stay private to them. The app is built for Android, iOS and the web from one codebase, and presents all of it through a premium dark interface designed to keep long study sessions comfortable.

### 1.3 Extended version (for a report's "Project Overview" chapter)

> **StudyMate AI** is an AI-powered mobile application designed to help students study more efficiently by removing the friction of switching between separate tools for asking questions, summarising material, testing themselves, writing notes and planning revision.
>
> The application provides five core capabilities. **AI Chat** lets a student ask any academic question and receive a conversational answer from a study assistant. **PDF Summary** accepts an uploaded study document and returns an organised summary covering the main topic, key points, important definitions, core concepts, a short summary and exam-oriented notes. **AI Quiz** builds a custom multiple-choice quiz from any topic the student types, with a selectable number of questions (5, 10 or 15) and difficulty level (easy, medium or hard); answers are marked immediately, an explanation is shown for every question, and a final score with accuracy percentage is presented at the end. **Notes** provides full create, edit and delete management with live keyword search across titles and content. **Study Planner** allows students to record study sessions with a subject, date and duration, mark them done or undo them, delete them, and watch a progress percentage update as sessions are completed.
>
> A **Home Dashboard** ties these together: it greets the student by name, shows an avatar built from their initials, displays today's progress as a percentage bar with completed and remaining counts, presents the study tools as a card grid, and summarises total, completed and remaining sessions.
>
> Access is account-based. Students register with a full name, email and password, log in with email and password, can reset a forgotten password by email, and can sign out from the dashboard. The application enforces authentication at the navigation level — a signed-out user cannot reach the dashboard — and each student's notes and study sessions are stored separately using their unique Firebase user ID, so two accounts on the same device never see each other's data.
>
> Visually, the app uses a consistent premium dark theme: deep navy backgrounds, frosted glass cards, soft coloured ambient glows, glowing accent buttons and the Poppins typeface, giving it a modern, focused, distraction-free look suitable for extended study use.

---

## 2. Section Two — Technical Introduction

### 2.1 Standard version (recommended — replaces your second paragraph)

> **StudyMate AI** is developed with **Expo (SDK 54)** and **React Native 0.81** in **TypeScript**, using **Expo Router 6** for file-based navigation — it is *not* a Flutter application. **Firebase** is used for **Authentication only**: email/password registration, login, password-reset emails and the user's display name, which also supplies the unique user ID (`uid`) that keeps each student's data separate. Notes and study sessions are persisted **on the device** with **AsyncStorage**, under keys scoped to that `uid`. All AI functionality is delivered by a **separate Node.js / Express 5 REST backend** that calls **Google Gemini** through three endpoints — streaming chat, PDF summarisation and quiz generation. A single codebase builds to **Android, iOS and web**.

### 2.2 Detailed version (for a report's "Technology & Architecture" chapter)

> StudyMate AI follows a **three-tier architecture**: an Expo/React Native client, a Firebase Authentication service, and a self-hosted Node.js AI service.
>
> **Client tier.** The mobile app is written in TypeScript (strict mode) with Expo SDK 54, React Native 0.81.5 and React 19.1.0. Navigation uses Expo Router 6's file-based routing: a root stack layout owns the authentication listener and the route guard, a tab group holds the Home dashboard, and each feature (AI Chat, PDF Summary, Quiz, Notes, Study Planner) is its own stack screen pushed from the dashboard. The New Architecture is enabled, the Android build is edge-to-edge, and the UI is entirely hand-styled with React Native `StyleSheet` — a dark palette, glassmorphic cards, ambient glow layers and the Poppins font family loaded through `@expo-google-fonts/poppins`. Icons come from `@expo/vector-icons` (Ionicons).
>
> **Authentication tier.** The Firebase JavaScript SDK v12 is initialised once and a single `auth` object is shared by six screens. Registration creates the account and writes the student's full name to the Firebase profile as `displayName`; the app deliberately signs the user out afterwards so they must log in explicitly. Login, password-reset email and sign-out are all handled with the Firebase Auth SDK. A root-level `onAuthStateChanged` listener drives both the loading gate and the navigation guard: signed-out users are redirected away from the dashboard, and signed-in users skip the welcome screen. The dashboard reads `displayName` for the greeting and derives the avatar initials from it.
>
> **Data tier.** StudyMate AI does not use Firestore, the Realtime Database or Firebase Storage. Notes and planner sessions are stored locally on the device using `@react-native-async-storage/async-storage`, as JSON arrays under per-user keys — `@studymate_notes_<uid>` and `studymate_study_sessions_<uid>`. The Firebase `uid` is therefore the join key between the cloud identity layer and the local data layer, which is what makes storage user-specific. Both screens expose a single writer function for all create/update/delete operations, and the dashboard re-reads the planner key on every screen focus so progress updates immediately after the student returns from the planner.
>
> **AI tier.** A separate Node.js service built on Express 5 exposes three REST endpoints on port 3000: `POST /chat` (streams the model's answer back chunk by chunk), `POST /summarize-pdf` (accepts a multipart PDF upload up to 10 MB via multer, converts it to base64 and sends it as inline data with a structured summarisation prompt) and `POST /generate-quiz` (prompts for a strict JSON quiz schema, strips markdown fences, parses and fully validates the question count, option count, answer index range and option types before returning it). All three share one Google GenAI client, one model constant (`gemini-3.6-flash`) and one retry helper with exponential backoff on rate-limit and server errors. The Gemini API key is read from an environment file and is never shipped inside the mobile app — the app only ever talks to the Express server. The Android client reaches the server through the emulator's host alias `10.0.2.2`.
>
> **Build targets.** One codebase produces the Android app (application ID `com.sanjitahmed.studymateai`, adaptive icons, splash screen), an iOS build (tablet supported) and a static web export, configured entirely through `app.json` with Expo's continuous native generation — no native Android or iOS source is committed.

### 2.3 Technology stack table (drop-in for a report)

| Layer | Technology | Version | Where it is configured / used |
|---|---|---|---|
| Language | TypeScript (strict) | ~5.9.2 | `package.json:49`, `tsconfig.json:4` |
| Framework | Expo SDK | ~54.0.37 | `package.json:20`, `app.json` |
| Runtime | React Native | 0.81.5 | `package.json:37` |
| UI library | React | 19.1.0 | `package.json:35` |
| Navigation | Expo Router (file-based) + React Navigation 7 | ~6.0.24 | `package.json:28`, `package.json:3`, `app/_layout.tsx`, `app/(tabs)/_layout.tsx` |
| Architecture | React Native New Architecture | enabled | `app.json:10` |
| Authentication | Firebase Authentication (Email/Password) — JS SDK | ^12.18.0 | `package.json:34`, `firebaseConfig.ts:1-15` |
| Local database | AsyncStorage (key–value, JSON) | 2.2.0 | `package.json:16`, `app/notes.tsx:90`, `app/study-planner.tsx:76` |
| File picking | expo-document-picker (PDF) | ~14.0.8 | `package.json:22`, `app/pdf-summary.tsx:36-39` |
| Fonts | @expo-google-fonts/poppins (5 weights) | ^0.4.1 | `package.json:14`, `app.json:43`, `app/index.tsx:26-32` |
| Icons | @expo/vector-icons (Ionicons, MaterialCommunityIcons) | ^15.0.3 | `package.json:15`, `app/(tabs)/index.tsx:9` |
| Haptics | expo-haptics (iOS tab feedback) | ~15.0.8 | `components/haptic-tab.tsx:10-13` |
| Backend runtime | Node.js | — | `backend/package.json:6` |
| Backend framework | Express | ^5.1.0 | `backend/package.json:12`, `backend/server.js:9` |
| AI provider | Google Gemini via `@google/genai` | ^2.20.0 | `backend/package.json:9`, `backend/server.js:39-41` |
| AI model | `gemini-3.6-flash` | — | `backend/server.js:46` |
| File upload | multer (memory storage, 10 MB cap) | ^2.3.0 | `backend/package.json:13`, `backend/server.js:21-26` |
| Config / secrets | dotenv (`GEMINI_API_KEY`), cors | ^16.6.1 / ^2.8.5 | `backend/server.js:7,15,31-34` |
| Android target | application ID `com.sanjitahmed.studymateai`, edge-to-edge | — | `app.json:15,22` |
| iOS target | tablet supported | — | `app.json:11-13` |
| Web target | static export | — | `app.json:25-28` |
| Native build | Expo prebuild / EAS (no committed `android/` or `ios/`) | — | repository root |

### 2.4 API contract table (drop-in for a report)

| Endpoint | Method | Client call site | Server handler | Request | Response |
|---|---|---|---|---|---|
| `/` | GET | — (health check) | `backend/server.js:105-109` | — | `{ message }` |
| `/chat` | POST | `app/ai-chat.tsx:59-67` | `backend/server.js:114-238` | `{ message }` | streamed `text/plain` chunks (`:211-217`) |
| `/summarize-pdf` | POST | `app/pdf-summary.tsx:99-102` | `backend/server.js:243-317` | multipart field `pdf` (≤ 10 MB) | `{ fileName, summary }` (`:301-304`) |
| `/generate-quiz` | POST | `app/quiz.tsx:63-73` | `backend/server.js:322-519` | `{ topic, numberOfQuestions, difficulty }` | validated `{ topic, difficulty, questions[] }` (`:507`) |

---

## 3. Safe vs. unsafe wording (for viva / defence)

**Do NOT say** — the code contradicts it:

- ❌ "developed using Flutter" / "written in Dart" → it is React Native + Expo + TypeScript.
- ❌ "data is stored in Firebase" → only authentication is in Firebase; notes and planner data are in on-device AsyncStorage.
- ❌ "Firebase provides the AI" → Gemini provides the AI, through a separate Node/Express server.
- ❌ "uses Firebase Firestore / Realtime Database / Firebase Storage / Cloud Functions / FCM" → none of these appear anywhere in the repo.
- ❌ "AI answers stream token-by-token into the chat UI" → the server streams (`backend/server.js:211-217`) but the client buffers the whole reply with `response.text()` (`app/ai-chat.tsx:72`), so the bubble appears at once.
- ❌ "Today's Progress shows only today's sessions" → it aggregates **all** sessions; the session date is free text and is never parsed (`app/(tabs)/index.tsx:170-184`).
- ❌ "notes and planner data sync across devices" → storage is device-local; a reinstall or a new phone loses it.
- ❌ "all screens are protected by the auth guard" → the guard covers `(tabs)` and the welcome screen only; the planner protects itself in-screen, notes and the three AI screens do not (`app/_layout.tsx:44-66`).

**Safe to say** — verified in the code:

- ✅ "Cross-platform: Android, iOS and web from a single Expo/React Native TypeScript codebase."
- ✅ "Firebase Authentication with email/password, including password-reset email and display name."
- ✅ "Per-user data isolation using the Firebase `uid` as the storage key suffix."
- ✅ "Nine functional screens: Welcome, Login, Register, Home Dashboard, AI Chat, PDF Summary, Quiz, Notes, Study Planner."
- ✅ "Navigation-level authentication guard with a loading gate so no screen flashes before Firebase resolves."
- ✅ "AI served by a dedicated Express backend that keeps the Gemini API key off the device."
- ✅ "Quiz answers are validated server-side (question count, four options, integer answer index 0–3, non-empty strings) before reaching the app."
- ✅ "Retry with exponential backoff on Gemini rate-limit and 5xx errors."
- ✅ "Hand-built premium dark UI: glassmorphic cards, ambient glow layers, Poppins typography, custom progress bars."

---

## 4. Shortest possible accurate pair (if you need exactly two sentences)

> **1.** StudyMate AI is a cross-platform mobile application that helps students study smarter by combining an AI chat assistant, PDF summarisation, automatic quiz generation, private note management and a study planner with progress tracking in one account-based, dark-themed app.
>
> **2.** It is built with Expo and React Native in TypeScript using Expo Router for navigation, Firebase Authentication for email/password accounts, on-device AsyncStorage keyed by the user's Firebase UID for notes and study sessions, and a separate Node.js/Express backend that calls Google Gemini for all AI features.

---

## 5. Simple (plain-English) versions

Same facts, shorter sentences, no heavy technical wording. Use these for a presentation slide,
a README, or a report section that must be easy to read.

### 5.1 Section One — What the app is

> **StudyMate AI** is a mobile app that helps students study better. In one app, a student can ask
> study questions to an AI assistant, upload a PDF and get a clear summary, make practice quizzes on
> any topic, write and manage personal notes, and build a study plan. The app also shows how much of
> the plan is finished and how much is left. A student must create an account and log in to use it, so
> every student's notes and study plan stay private. The app runs on Android, iPhone and the web, and
> uses a dark design that is comfortable for long study sessions.

### 5.2 Section Two — How the app is built

> **StudyMate AI** is built with **Expo** and **React Native** using **TypeScript**. It is **not** a
> Flutter app. **Firebase** is used only for the account system — sign up, log in, "forgot password"
> email and the user's display name. Notes and study plans are **not** stored in Firebase; they are
> saved on the phone itself. Each student's data is saved under their own Firebase user ID, so one
> student can never see another student's data. The AI features — chat, PDF summary and quiz — are
> served by a separate **Node.js** and **Express** server, which sends the requests to **Google
> Gemini**. This keeps the AI secret key out of the mobile app. The same codebase builds for Android,
> iOS and the web.

### 5.3 Even simpler (3 sentences each — for a slide)

> **1.** StudyMate AI is a mobile app where students can chat with an AI tutor, summarise PDFs, take
> auto-generated quizzes, keep notes and plan their study sessions.
>
> **2.** It is built with Expo and React Native in TypeScript; Firebase handles login only, while notes
> and study plans are stored on the phone under each user's own ID.
>
> **3.** All AI answers come from a separate Node.js server that talks to Google Gemini, and the same
> app runs on Android, iOS and the web.

### 5.4 Feature list in plain words (slide bullet points)

- **AI Chat** — ask any study question and get an answer. (`app/ai-chat.tsx`)
- **PDF Summary** — pick a PDF, get main topic, key points, definitions and exam notes. (`app/pdf-summary.tsx`)
- **AI Quiz** — type a topic, choose 5/10/15 questions and easy/medium/hard, then answer with instant marking, explanations and a final score. (`app/quiz.tsx`)
- **My Notes** — create, edit, delete and search your own notes. (`app/notes.tsx`)
- **Study Planner** — add study sessions with subject, date and duration; mark them Done or Undo; delete them. (`app/study-planner.tsx`)
- **Home Dashboard** — greeting with your name, initials avatar, progress bar, completed and remaining counts, and shortcuts to every tool. (`app/(tabs)/index.tsx`)
- **Account** — register, log in, reset password by email, sign out; the dashboard is locked for logged-out users. (`app/login.tsx`, `app/register.tsx`, `app/_layout.tsx`)

---

## 6. Very easy versions (simplest English + বাংলা)

Written so that anyone — including a non-technical reader — can understand them on the first read.
Short sentences, no jargon, but every fact is still correct according to the code in this repository.

### 6.1 Section One — What is StudyMate AI? (very easy English)

> **StudyMate AI** is a mobile app for students. It makes studying easier.
>
> With this app, a student can:
>
> - ask any study question to an AI assistant,
> - upload a PDF and get a short, easy summary of it,
> - make practice quizzes on any topic,
> - write and save their own notes,
> - and plan what to study and when.
>
> The app also shows how much of the study plan is finished and how much is still left.
>
> To use the app, a student must first create an account and log in. Because of this, one student's
> notes and study plan stay private — nobody else can see them.
>
> The app works on Android, iPhone and web. It has a dark design, which is comfortable for the eyes
> during long study sessions.

### 6.2 Section Two — How was the app built? (very easy English)

> **StudyMate AI** is built with **Expo** and **React Native**, using the **TypeScript** language.
> It is **not** built with Flutter.
>
> **Firebase** is used only for the login part — creating an account, logging in, the "forgot
> password" email, and the user's name.
>
> Notes and study plans are **not** kept in Firebase. They are saved on the student's own phone.
> Every student's data is saved under their own user ID, so one student can never see another
> student's data.
>
> The AI features — chat, PDF summary and quiz — come from a **separate server**. That server is
> built with **Node.js** and **Express**, and it sends the requests to **Google Gemini**. Because the
> AI runs on the server, the secret AI key stays safe and is never placed inside the mobile app.
>
> From the same code, the Android app, the iOS app and the web version are all built.

### 6.3 সেকশন ১ — StudyMate AI কী? (সবচেয়ে সহজ বাংলা)

> **StudyMate AI** শিক্ষার্থীদের জন্য তৈরি একটি মোবাইল অ্যাপ। এটি পড়াশোনাকে সহজ করে দেয়।
>
> এই অ্যাপ দিয়ে একজন শিক্ষার্থী যা যা করতে পারে:
>
> - AI অ্যাসিস্ট্যান্টকে যেকোনো পড়াশোনার প্রশ্ন করতে পারে,
> - PDF আপলোড করে তার সহজ ও ছোট সারসংক্ষেপ (summary) নিতে পারে,
> - যেকোনো টপিকের ওপর প্র্যাকটিস কুইজ তৈরি করতে পারে,
> - নিজের নোট লিখে সংরক্ষণ করতে পারে,
> - এবং কী পড়বে, কখন পড়বে — তার একটি পরিকল্পনা সাজাতে পারে।
>
> পড়ার পরিকল্পনার কতটুকু শেষ হয়েছে আর কতটুকু বাকি আছে, অ্যাপটি তাও দেখিয়ে দেয়।
>
> অ্যাপটি ব্যবহার করতে হলে শিক্ষার্থীকে প্রথমে অ্যাকাউন্ট খুলতে হয় এবং লগইন করতে হয়। এর ফলে
> একজনের নোট ও পড়ার পরিকল্পনা অন্য কেউ দেখতে পায় না — সবকিছু নিজের কাছেই নিরাপদ থাকে।
>
> অ্যাপটি অ্যান্ড্রয়েড, আইফোন ও ওয়েব — তিন জায়গাতেই চলে। এর ডিজাইন ডার্ক থিমের, তাই দীর্ঘসময়
> পড়াশোনা করলেও চোখে চাপ পড়ে না।

### 6.4 সেকশন ২ — অ্যাপটি কীভাবে তৈরি করা হয়েছে? (সবচেয়ে সহজ বাংলা)

> **StudyMate AI** তৈরি করা হয়েছে **Expo** এবং **React Native** দিয়ে, **TypeScript** ভাষা ব্যবহার
> করে। এটি **Flutter** দিয়ে তৈরি নয়।
>
> **Firebase** ব্যবহার করা হয়েছে শুধু লগইন সিস্টেমের জন্য — অ্যাকাউন্ট খোলা, লগইন করা, "পাসওয়ার্ড
> ভুলে গেছি" ইমেইল পাঠানো এবং ব্যবহারকারীর নাম সংরক্ষণ করা।
>
> নোট ও পড়ার পরিকল্পনা Firebase-এ রাখা হয় **না**। এগুলো শিক্ষার্থীর নিজের ফোনেই সংরক্ষিত থাকে।
> প্রতিটি শিক্ষার্থীর তথ্য তার নিজের ইউজার আইডি (user ID) ধরে আলাদাভাবে রাখা হয়, তাই একজনের তথ্য
> অন্য কেউ দেখতে পায় না।
>
> AI ফিচারগুলো — চ্যাট, PDF সামারি ও কুইজ — একটি **আলাদা সার্ভার** থেকে আসে। সার্ভারটি **Node.js** ও
> **Express** দিয়ে তৈরি, এবং এটি **Google Gemini**-র কাছে রিকোয়েস্ট পাঠায়। AI সার্ভারে চলার কারণে
> গোপন AI কী (secret key) মোবাইল অ্যাপের ভেতরে থাকে না, ফলে তা নিরাপদ থাকে।
>
> একই কোড থেকে অ্যান্ড্রয়েড অ্যাপ, আইওএস অ্যাপ ও ওয়েব ভার্সন — তিনটিই তৈরি করা যায়।

### 6.5 দুই লাইনে (স্লাইডের জন্য)

> **১.** StudyMate AI একটি মোবাইল অ্যাপ, যেখানে শিক্ষার্থী AI-র সাথে প্রশ্নোত্তর করতে পারে, PDF-এর
> সামারি নিতে পারে, কুইজ দিতে পারে, নোট লিখতে পারে এবং পড়ার পরিকল্পনা সাজিয়ে তার অগ্রগতি দেখতে পারে।
>
> **২.** এটি Expo ও React Native (TypeScript) দিয়ে তৈরি; Firebase শুধু লগইনের জন্য ব্যবহৃত হয়, নোট ও
> পড়ার পরিকল্পনা ফোনেই সংরক্ষিত থাকে, আর সব AI উত্তর আসে একটি আলাদা Node.js সার্ভার থেকে যা Google
> Gemini ব্যবহার করে।

### 6.6 তিনটি নিয়ম — এই সহজ ভাষাগুলো যেন ভুল না হয়

| সহজ কথায় বলুন | কখনো বলবেন না | কেন |
|---|---|---|
| "Expo ও React Native দিয়ে তৈরি" | "Flutter দিয়ে তৈরি" | রিপোতে কোনো Dart কোড, `pubspec.yaml` বা `lib/` ফোল্ডার নেই — `package.json:20,35,37` |
| "Firebase শুধু লগইনের জন্য" | "ডেটা Firebase-এ থাকে" | Firestore/Realtime Database কোথাও ব্যবহার হয়নি — `firebaseConfig.ts:1-15` |
| "নোট ও প্ল্যান ফোনেই সংরক্ষিত" | "সব ডিভাইসে সিঙ্ক হয়" | AsyncStorage ডিভাইস-লোকাল — `app/notes.tsx:90`, `app/study-planner.tsx:76` |
| "AI উত্তর আলাদা সার্ভার থেকে আসে (Google Gemini)" | "Firebase AI দেয়" | Express সার্ভার + Gemini — `backend/server.js:39-46` |
