# StudyMate AI — Complete Code Map & Step-by-Step Functionality Guide

> **How to read this document**
> Every reference uses the format `path/to/file.tsx:LINE` or `path/to/file.tsx:START-END`.
> Line numbers are exact for commit `5ea6dc1` on branch `arena/01a0edfe-mate` (working tree clean).
> If you edit a file, line numbers below it shift — re-run the "locate" commands in §12 to refresh them.
>
> **Scope covered:** UI/UX design · Firebase Authentication · Notes Management · Study Planner ·
> Navigation & App Structure · (plus the AI backend, because Notes/Planner/Chat/Quiz/PDF are
> functionally inseparable from it).

---

## Table of Contents

1. [Repository map — what each file is responsible for](#1-repository-map)
2. [Runtime architecture — the 3 processes and how they talk](#2-runtime-architecture)
3. [UI/UX Design — design system + every screen, visual → code](#3-uiux-design)
4. [Firebase Authentication — register, login, logout, forgot password, displayName, protected navigation](#4-firebase-authentication)
5. [Notes Management — create / edit / delete / user-specific storage](#5-notes-management)
6. [Study Planner — create / complete / remaining / today's progress / user-specific data](#6-study-planner)
7. [Navigation & App Structure — Expo Router, guards, Android integration](#7-navigation--app-structure)
8. [AI feature screens ↔ Node/Gemini backend correlation](#8-ai-screens--backend-correlation)
9. [Cross-file correlation matrix (the "how does A connect to B" table)](#9-cross-file-correlation-matrix)
10. [End-to-end user journeys, traced line by line](#10-end-to-end-user-journeys)
11. [Data storage map (AsyncStorage keys & shapes)](#11-data-storage-map)
12. [How to run everything + locate commands](#12-how-to-run--locate-commands)
13. [Gaps, bugs & inconsistencies found while mapping (with fixes)](#13-gaps-bugs--inconsistencies)
14. ["I want to change X" quick reference](#14-i-want-to-change-x--quick-reference)

---

<a name="1-repository-map"></a>
## 1. Repository map — what each file is responsible for

### 1.1 Frontend (Expo / React Native, TypeScript)

| File | Lines | Responsibility | Owns which topic from your list |
|---|---|---|---|
| `app/_layout.tsx` | 140 | Root Stack navigator, Firebase auth listener, **route guard**, splash/loading gate, nav theme | §2 Auth-based navigation, §5 Navigation |
| `app/index.tsx` | 277 | Welcome / "Get Started" screen (route `/`) | §1 UI/UX |
| `app/login.tsx` | 436 | Login screen + **Forgot Password** | §2 Auth (Login, Forgot Password) |
| `app/register.tsx` | 502 | Registration screen + **displayName write** | §2 Auth (Registration, display name) |
| `app/(tabs)/_layout.tsx` | 35 | Bottom-tab navigator (Home, Explore), tab tint, haptics | §5 Navigation |
| `app/(tabs)/index.tsx` | 1349 | **Home Dashboard**: greeting, initials, sign out, Today's Progress, 4 feature cards, planner banner, stats grid, daily tip | §1 UI/UX, §2 Logout, §4 Planner progress |
| `app/(tabs)/explore.tsx` | 112 | Untouched Expo template screen (dead weight — see §13.6) | — |
| `app/notes.tsx` | 758 | **Notes**: CRUD + search + per-user AsyncStorage | §3 Notes Management |
| `app/study-planner.tsx` | 1025 | **Planner**: add/complete/undo/delete sessions + per-user AsyncStorage + own login gate | §4 Study Planner |
| `app/ai-chat.tsx` | 650 | AI chat UI + `POST /chat` client | §1 UI/UX (chat), §8 |
| `app/quiz.tsx` | 934 | Quiz setup → questions → scoring → results + `POST /generate-quiz` client | §1 UI/UX (quiz), §8 |
| `app/pdf-summary.tsx` | 563 | PDF picker + `POST /summarize-pdf` client | §1 UI/UX, §8 |
| `app/modal.tsx` | 29 | Template modal demo, declared at `app/_layout.tsx:129-135`, never opened | — |
| `app/api/chat+api.ts` | **0 (empty)** | Orphan Expo API route — see §13.1 | — |
| `firebaseConfig.ts` | 15 | **Single source of truth for Firebase**: `initializeApp` + `getAuth`, exports `auth` | §2 Auth foundation |
| `constants/theme.ts` | 53 | Template light/dark palette (`Colors`) + `Fonts`; used **only** by tabs/explore + themed components | §1 (partial — see §13.4) |
| `hooks/use-color-scheme.ts` | 1 | Re-export of RN `useColorScheme` | §1 theming |
| `hooks/use-color-scheme.web.ts` | 21 | Web hydration-safe variant | §1 theming |
| `hooks/use-theme-color.ts` | 21 | Resolve a color by theme | §1 theming (template only) |
| `components/haptic-tab.tsx` | 18 | Tab button with iOS haptic feedback — wired at `app/(tabs)/_layout.tsx:17` | §5 Navigation |
| `components/ui/icon-symbol.tsx` | 41 | Android/web icon mapper (`house.fill`→`home`, `paperplane.fill`→`send`) used by tab bar | §5 Navigation, Android |
| `components/ui/icon-symbol.ios.tsx` | 32 | iOS SF Symbols variant | §5 Navigation |
| `components/themed-text.tsx`, `themed-view.tsx`, `parallax-scroll-view.tsx`, `ui/collapsible.tsx`, `external-link.tsx`, `hello-wave.tsx` | — | Template components; only `explore.tsx`/`modal.tsx` use them | — |
| `app.json` | 50 | Expo config: app name, slug, **Android package/adaptive icon/edge-to-edge**, splash, plugins, typed routes | §5 Android integration |
| `package.json` | 52 | Entry `expo-router/entry`, scripts `start/android/ios/web/lint`, deps (firebase 12.x, expo-router 6.x, async-storage, document-picker, poppins) | §5 structure |
| `tsconfig.json` | 15 | `strict: true`, path alias `@/*` → `./*` (used by `@/components/...` imports) | §5 structure |
| `assets/images/*` | — | `icon.png`, `splash-icon.png`, `android-icon-{foreground,background,monochrome}.png`, `favicon.png` + leftover template logos | §5 Android |

### 1.2 Backend (Node.js / Express / Gemini)

| File | Lines | Responsibility |
|---|---|---|
| `backend/server.js` | 531 | Express server on `0.0.0.0:3000`. Routes: `GET /` (`:105-109`), `POST /chat` streaming (`:114-238`), `POST /summarize-pdf` (`:243-317`), `POST /generate-quiz` (`:322-519`). Shared Gemini client (`:39-41`), model constant (`:46`), retry helper (`:51-100`) |
| `backend/package.json` | 15 | Deps: `@google/genai`, `express@5`, `cors`, `dotenv`, `multer`; `npm start` → `node server.js` |
| `backend/.env` | *absent (gitignored)* | Must contain `GEMINI_API_KEY`; server **exits** without it (`backend/server.js:31-34`, ignore rule `.gitignore:2-4`) |

**There is no Firebase/Firestore backend code at all** — Firebase is used **only** for Authentication. All Notes and Planner data lives on-device in AsyncStorage, partitioned by Firebase UID (see §11). This is the single most important architectural fact in the repo.

---

<a name="2-runtime-architecture"></a>
## 2. Runtime architecture — the 3 processes and how they talk

```
┌───────────────────────────── ANDROID DEVICE / EMULATOR ─────────────────────────────┐
│                                                                                     │
│  Expo App (React Native, expo-router file-based routing)                            │
│                                                                                     │
│   app/_layout.tsx:18  RootLayout  ── onAuthStateChanged (:29) ──┐                   │
│        │                                                        │                   │
│        ├── /            app/index.tsx:22      Welcome           │                   │
│        ├── /login       app/login.tsx:32      Login + Forgot    │                   │
│        ├── /register    app/register.tsx:33   Register          │                   │
│        ├── /(tabs)      app/(tabs)/_layout.tsx:9  Tab navigator │                   │
│        │      ├── Home     app/(tabs)/index.tsx:43  Dashboard ◄─┤                   │
│        │      └── Explore  app/(tabs)/explore.tsx:12 (template) │                   │
│        ├── /notes       app/notes.tsx:26 ────────┐              │                   │
│        ├── /study-planner app/study-planner.tsx:30 ──┐          │                   │
│        ├── /ai-chat     app/ai-chat.tsx:23 ──┐   │   │          │                   │
│        ├── /quiz        app/quiz.tsx:29 ──┐  │   │   │          │                   │
│        └── /pdf-summary app/pdf-summary.tsx:23 ─┐│  │   │       │                   │
│                                                 ││  │   │       │                   │
│   AsyncStorage (on-device, per-UID keys) ◄──────┼┼──┼───┘       │                   │
│     "@studymate_notes_<uid>"                    ││  │           │                   │
│     "studymate_study_sessions_<uid>"            ││  │           │                   │
└─────────────────────────────────────────────────┼┼──┼───────────┼───────────────────┘
              │ HTTPS (Firebase SDK)              ││  │           │
              ▼                                   ││  │           │ HTTP (fetch)
┌───────────────────────────────┐                 ││  │           ▼
│  Firebase Auth                │                 ││  │  ┌────────────────────────────┐
│  project studymate-ai-d8550   │◄────────────────┘│  │  │  Node/Express  :3000       │
│  firebaseConfig.ts:4-15       │                  │  │  │  backend/server.js:524     │
│  • create/signIn/signOut      │                  │  │  │  • POST /chat       :114   │
│  • sendPasswordResetEmail     │                  │  │  │  • POST /summarize  :243   │
│  • updateProfile(displayName) │                  │  │  │  • POST /generate-quiz :322│
└───────────────────────────────┘                  │  │  └─────────────┬──────────────┘
                                                   │  │                │ @google/genai
                                                   ▼  ▼                ▼
                                            (chat/quiz/pdf use   ┌──────────────┐
                                             10.0.2.2:3000 =     │ Gemini API   │
                                             host localhost)     │ :39-46       │
                                                                 └──────────────┘
```

**Two independent persistence layers, deliberately separate:**

| Layer | Technology | Holds | Written by | Read by |
|---|---|---|---|---|
| Identity | Firebase Auth (cloud) | email, password hash, `displayName`, `uid` | `app/register.tsx:82-91`, `app/login.tsx:59-63` | `app/_layout.tsx:29`, `app/(tabs)/index.tsx:63`, `app/notes.tsx:48,68`, `app/study-planner.tsx:46` |
| Content | AsyncStorage (device) | notes[], study sessions[] | `app/notes.tsx:110-113`, `app/study-planner.tsx:121-124` | `app/notes.tsx:91`, `app/study-planner.tsx:84`, `app/(tabs)/index.tsx:87` |

The **`uid` is the join key** between the two layers. Everything "user-specific" in this app works because a Firebase `uid` is interpolated into an AsyncStorage key string.

---

<a name="3-uiux-design"></a>
## 3. UI/UX Design

### 3.1 The design system (it is hard-coded per screen, not centralized)

**Background colors — 3 distinct dark bases:**

| Hex | Where | Applied at |
|---|---|---|
| `#0B0F19` (near-black navy) | Welcome, Login, Register, auth loading gate | `app/index.tsx:44,121,117`; `app/login.tsx:125,254,250`; `app/register.tsx:128,330,326` |
| `#0F172A` (slate 900) | Notes, Planner, Quiz, PDF Summary | `app/notes.tsx:222,440`; `app/study-planner.tsx:286,309,345,609`; `app/quiz.tsx:141,445-446`; `app/pdf-summary.tsx:143,274` |
| `#070B14` (deepest) | AI Chat only | `app/ai-chat.tsx:179,323` |
| `#F7F9FC` (light) | Root auth loading screen — **the only light surface in the app** | `app/_layout.tsx:89` |

**Accent palette (recurring):**

| Role | Hex | Example definition sites |
|---|---|---|
| Primary action blue | `#2563EB` | `app/index.tsx:250`, `app/login.tsx:398`, `app/register.tsx:461-474` (`registerButton`) |
| Cyan accent / links / AI | `#38BDF8` | `app/index.tsx:56,199`, `app/login.tsx:145,392`, `app/(tabs)/index.tsx:236,289,301,326` |
| Purple glow | `#7C3AED` | `app/index.tsx:130`, `app/login.tsx:263`, `app/register.tsx:339` |
| Pink glow | `#EC4899` | `app/index.tsx:140`, `app/login.tsx:273`, `app/(tabs)/index.tsx:789+` |
| Notes violet | `#C084FC` | `app/(tabs)/index.tsx:574,583` |
| Quiz green | `#4ADE80` | `app/(tabs)/index.tsx:528,537` |
| PDF amber | `#FBBF24` | `app/(tabs)/index.tsx:481,490` |
| Chat blue | `#60A5FA` | `app/(tabs)/index.tsx:432,441` |
| Danger red | `#F87171` | `app/(tabs)/index.tsx:271` (sign-out icon) |
| Muted text | `#94A3B8`, `#64748B`, `#E2E8F0` | labels/placeholders everywhere |

**The "premium glassmorphism" recipe** — the same 3 ingredients repeated on every screen:

1. **Ambient glow blobs** — absolutely positioned circles, `borderRadius = size/2`, `opacity 0.2–0.25`, pushed off-screen with negative `top/left/right/bottom`.
   - Welcome: JSX `app/index.tsx:47-49` → styles `:125-154`
   - Login: JSX `app/login.tsx:128-130` → styles `:258-287`
   - Register: JSX `app/register.tsx:131-133` → styles `:334-363`
   - Dashboard: JSX `app/(tabs)/index.tsx:215-217` → styles `:778-810`
2. **Frosted card** — `backgroundColor: "rgba(255,255,255,0.06–0.07)"` + `borderWidth: 1` + `borderColor: "rgba(255,255,255,0.12)"` + large radius (16–24).
   - Canonical example: `app/login.tsx:342-348` (`card`), `app/index.tsx:220-229` (`featureCard`)
   - Dashboard cards: `app/(tabs)/index.tsx:918` (`heroCard`), `:1115` (`featureCard`), `:1177` (`plannerCard`), `:1261` (`overviewCard`), `:1295` (`motivationCard`)
3. **Colored shadow / glow under buttons** — `shadowColor` matching the fill + `shadowOffset {0,6}` + `shadowOpacity .35` + `shadowRadius 10` + Android `elevation: 6`.
   - `app/index.tsx:256-260`, `app/login.tsx:403-407`, `app/(tabs)/index.tsx` hero/button blocks

**Typography — Poppins (5 weights), loaded per-screen:**

| Screen | `useFonts()` call | Weights |
|---|---|---|
| Welcome | `app/index.tsx:26-32` | 400/500/600/700/800 |
| Login | `app/login.tsx:36-42` | same 5 |
| Register | `app/register.tsx:37-43` | same 5 |
| Dashboard | `app/(tabs)/index.tsx:47-53` | same 5 |
| **Notes, Planner, Quiz, AI Chat, PDF** | **none** | **system font** — 0 `fontFamily` occurrences in those 5 files (see §13.2) |

Package source: `package.json:14` (`@expo-google-fonts/poppins`); native font wiring: `app.json:43` (`expo-font` plugin).
Font-loading gate pattern (spinner until fonts ready): `app/index.tsx:34-40`, `app/login.tsx:115-121`, `app/register.tsx:118-124`, `app/(tabs)/index.tsx:156-165`.

**Icon system:** `Ionicons` everywhere (imported `app/index.tsx:9`, `app/login.tsx:9`, `app/register.tsx:9`, `app/(tabs)/index.tsx:9`) plus `MaterialCommunityIcons` for the dashboard robot (`app/(tabs)/index.tsx:9`, used `:323-327`). The 5 feature screens instead use **emoji as icons** (📝 ✏️ 🗑️ 📅 ⏱ ✅ 📚 🏆 🎯 ✨ 💡 📄 📁 🔍 ⏳ 🔐) — e.g. `app/notes.tsx:263,331,339,363,384,403,411,422`, `app/study-planner.tsx:290,313,389,518,535,539,574,582`. That is a deliberate stylistic split (see §13.3).

**Status bar:** every screen forces `barStyle="light-content"` with a matching background — `app/index.tsx:44`, `app/login.tsx:125`, `app/register.tsx:128`, `app/(tabs)/index.tsx:209-212`, `app/notes.tsx:222`, `app/study-planner.tsx:284-287 / 307-310 / 343-346`, `app/quiz.tsx:141`, `app/pdf-summary.tsx:143`, `app/ai-chat.tsx:177-180`. Root-level `<StatusBar style="auto" />` at `app/_layout.tsx:138` is overridden by these.

### 3.2 Welcome screen (`/`) → `app/index.tsx`

| Visual element (top → bottom) | JSX lines | Style lines |
|---|---|---|
| Dark canvas + status bar | `43-44` | `container:119-122` |
| 3 ambient glow blobs (purple/pink/blue) | `47-49` | `125-134`, `135-144`, `145-154` |
| Logo: 96px glow halo + 80px circle + `school-outline` icon | `53-58` | `logoWrapper:164-170`, `logoGlow:171-177`, `logoCircle:178-187` |
| Title "StudyMate AI" (34px ExtraBold white) | `61` | `title:189-195` |
| Subtitle (cyan, SemiBold) | `62` | `subtitle:196-202` |
| Description paragraph (max width 320) | `64-67` | `description:203-211` |
| 3 glass feature chips: AI Chat / PDF Summary / AI Quiz | `70-91` | `features:214-219`, `featureCard:220-229`, `featureIconWrapper:230-238`, `featureText:239-244` |
| **"Get Started" CTA** → `router.push("/login")` | `94-101` (handler `96`) | `button:247-261`, `buttonText:262-266`, `arrow:267-269` |
| Footer tagline | `104-106` | `footer:272-277` |

Function: `WelcomeScreen` declared `app/index.tsx:22`; router hook `:23`; the **only** logic is the navigation call at `:96`.

### 3.3 Login screen (`/login`) → `app/login.tsx`

| Visual element | JSX | Styles |
|---|---|---|
| Canvas + status bar | `124-125` | `container:252-255` |
| Glow blobs | `128-130` | `258-287` |
| Keyboard-aware scroll wrapper (iOS `padding`) | `132-140` | `keyboardView:289-291`, `scrollContent:292-297` |
| Logo halo + circle + `school-outline` | `142-147` | `300-324` |
| "Welcome Back" + subtitle | `150-153` | `title:326-332`, `subtitle:333-339` |
| **Glass form card** | `156` | `card:342-348` |
| Email field (icon + input) | `158-173` | `inputContainer:350-352`, `label:353-359`, `inputWrapper:360-369`, `inputIcon:370-372`, `input:373-379` |
| Password field + **eye toggle** | `176-200` (toggle `188-198`, state flip `189`) | `eyeIcon:380-382` |
| **"Forgot Password?" link** → `handleForgotPassword` | `203-209` (handler `205`) | `forgotButton:384-388`, `forgotText:389-393` |
| **Login button** (spinner while `isLoading`) → `handleLogin` | `212-226` (handler `214`, disabled `215`, spinner `218-219`) | `loginButton:396-408`, `disabledButton:409-411`, `loginButtonText:412-416`, `buttonArrow:417-419` |
| "Don't have an account? Register" → `router.push("/register")` | `230-238` (handler `233`) | `registerContainer:422-426`, `registerText:427-431`, `registerLink:432-436` |

State: `email:44`, `password:45`, `showPassword:46`, `isLoading:47`.

### 3.4 Register screen (`/register`) → `app/register.tsx`

| Visual element | JSX | Styles |
|---|---|---|
| Canvas + status bar + glows | `127-133` | `container:328-331`, glows `334-363` |
| Logo halo + `person-add-outline` | `145-150` | `376-400` |
| "Create Account" + subtitle | `153-156` | `title:402-408`, `subtitle:409-417` |
| Glass card | `159` | `card:418-425` |
| **Full Name** field (`person-outline`) | `161-180` | `inputContainer:426`, `inputWrapper:436`, `input:449` |
| Email field | `183-203` | same shared styles |
| Password + eye toggle | `206-236` (toggle `224-234`) | `eyeIcon:456-460` |
| Confirm Password + eye toggle (`shield-checkmark-outline`) | `239-275` (toggle `257-273`) | — |
| **"Create Account" button** (spinner while loading) → `handleRegister` | `278-302` (handler `283`, disabled `284`, spinner `287-288`) | `registerButton:461-474`, `disabledButton:475-477`, `registerButtonText:478-482`, `buttonArrow:483-487` |
| "Already have an account? Login" → `router.push("/login")` | `306-314` (handler `309`) | `loginContainer:488-492`, `loginText:493-497`, `loginLink:498-502` |

State: `name:45`, `email:46`, `password:47`, `confirmPassword:48`, `showPassword:50`, `showConfirmPassword:51`, `isLoading:52`.

### 3.5 Home Dashboard (`/(tabs)`) → `app/(tabs)/index.tsx`  — the visual hub

Layout order on screen, top → bottom:

| # | Visual block | JSX | Styles |
|---|---|---|---|
| 1 | Dark canvas + status bar | `208-212` | `container:773-777` |
| 2 | 3 ambient glows | `215-217` | `778-810` |
| 3 | Scroll container | `219-222` | `scrollContent:811-816` |
| 4 | **Header row**: "WELCOME BACK" pill + waving-hand icon, `Hello, {userName}!`, subtitle | `226-248` (greeting `241-243`) | `header:817-824`, `headerLeft:825-829`, `smallGreetingBox:830-835`, `smallGreeting:836-842`, `greeting:843-848`, `subtitle:849-854` |
| 5 | **Avatar**: glow + circle with **initials** + green online dot | `250-260` (initials injected `255`) | `profileWrapper:855-861`, `profileGlow:862-869`, `profileCircle:870-880`, `profileText:881-886`, `onlineDot:887-898` |
| 6 | **Sign Out button** (red icon + label) → `handleSignOut` | `263-277` (handler `265`) | `signOutButton:899-910`, `signOutText:911-917` |
| 7 | **Hero card**: "AI STUDY ASSISTANT" badge, sparkle circle, "Your learning / journey continues.", description, robot icon | `283-329` | `heroCard:918-926`, `heroTop:927-932`, `aiBadge:933-943`, `aiBadgeText:944-951`, `sparkleCircle:952-962`, `heroMain:963-969`, `heroTextContainer:970-974`, `heroTitle:975-980`, `heroTitleAccent:981-986`, `heroDescription:987-994`, `heroRobot:995-1005` |
| 8 | **"Today's Progress"** section: title + dynamic subtitle + **% circle** + **animated-width bar** + "N completed / N remaining" | `332-373` (title `335-337`, subtitle `339-343`, % `346-350`, bar `353-362`, footer `364-372`) | `heroProgressSection:1006-1013`, `progressHeader:1014-1020`, `progressTitle:1021-1026`, `progressSubtitle:1027-1032`, `percentCircle:1033-1041`, `progressPercent:1042-1047`, `progressBackground:1048-1054`, `progressFill:1055-1060`, `progressFooter:1061-1066`, `progressSmall:1067-1072` |
| 9 | Section header "Smart Study Tools" + "AI" mini badge | `379-395` | `sectionHeader:1073-1079`, `sectionTitle:1080-1085`, `sectionSubtitle:1086-1091`, `aiMiniBadge:1092-1102`, `aiMiniText:1103-1108` |
| 10 | **2×2 feature grid** | `400-588` | `featureGrid:1109-1114`, `featureCard:1115-1125`, `featureIconBox:1126-1134` |
| 10a | └ AI Chat card (blue) → `/ai-chat` | `402-445` (nav `404`) | `chatIconBox:1135-1138` |
| 10b | └ PDF Summary card (amber) → `/pdf-summary` | `448-494` (nav `451`) | `pdfIconBox:1139-1142` |
| 10c | └ AI Quiz card (green) → `/quiz` | `497-541` (nav `499`) | `quizIconBox:1143-1146` |
| 10d | └ My Notes card (violet) → `/notes` | `544-587` (nav `546`) | `notesIconBox:1147-1150` |
| 10e | └ shared card text styles | — | `featureTitle:1151-1157`, `featureDescription:1158-1164`, `featureBottom:1165-1171`, `featureAction:1172-1176` |
| 11 | **Study Planner banner** ("PLAN SMART" tag, title, description, arrow circle) → `/study-planner` | `593-632` (nav `596`) | `plannerCard:1177-1188`, `plannerIconBox:1189-1197`, `plannerContent:1198-1203`, `plannerTag:1204-1212`, `plannerTagText:1213-1219`, `plannerTitle:1220-1225`, `plannerDescription:1226-1232`, `plannerArrowCircle:1233-1241` |
| 12 | "Your Study Overview" header + `stats-chart` icon | `637-647` | `statsHeader:1242-1248`, `statsTitle:1249-1254` |
| 13 | **3-up stats grid**: Total Sessions (blue `#1D4ED8`), Completed (green `#15803D`), Remaining (amber `#B45309`) | `649-721` (numbers `666`, `690`, `714`) | `overviewGrid:1255-1260`, `overviewCard:1261-1271`, `overviewIconBox:1272-1280`, `overviewNumber:1281-1286`, `overviewLabel:1287-1294` |
| 14 | **"DAILY AI TIP"** card (bulb icon, tag, title, body) | `726-757` | `motivationCard:1295-1304`, `motivationIconBox:1305-1313`, `motivationContent:1314-1318`, `motivationTop:1319-1325`, `motivationTag:1326-1332`, `motivationTitle:1333-1338`, `motivationText:1339-1346` |
| 15 | Bottom spacer (scroll breathing room) | `759` | `bottomSpace:1347-1349` |

### 3.6 AI Chat interface → `app/ai-chat.tsx`

| Visual element | JSX | Styles |
|---|---|---|
| Darkest canvas `#070B14` | `176-180` | `safeArea:321-325` |
| Keyboard-avoiding shell | `182-185` | `keyboardContainer:326-332` |
| **Header**: back chevron `‹`, "✦" AI badge, "StudyMate AI" + green **online dot** + "AI Assistant", `•••` more button (decorative) | `188-223` (back `191`, badge `198-200`, online `207-213`, more `217-222`) | `header:333-342`, `backButton:343-353`, `backIcon:354-360`, `headerCenter:361-367`, `headerAiIcon:368-379`, `headerAiText:380-384`, `headerTitle:385-391`, `onlineContainer:392-397`, `onlineDot:398-405`, `onlineText:406-410`, `moreButton:411-421`, `moreIcon:422-430` |
| **Message list** (`FlatList`, seeded with AI greeting) | `227-236` (seed `30-36`) | `chatList:431-435`, `chatContent:436-441` |
| **Bubble renderer**: AI row = avatar + label "StudyMate AI" + left bubble; user row = right-aligned blue bubble | `131-170` (branch `132`, avatar `141-145`, label `153-155`) | `messageRow:442-447`, `aiRow:448-451`, `userRow:452-455`, `aiAvatar:456-467`, `aiAvatarText:468-472`, `messageBubble:473-479`, `aiBubble:480-486`, `userBubble:487-493`, `aiLabel:494-501`, `messageText:502-506`, `aiMessageText:507-510`, `userMessageText:511-516` |
| **"Thinking…" typing indicator** (3 dots) shown while `loading` | `240-256` | `typingContainer:517-523`, `typingAvatar:524-533`, `typingAvatarText:534-538`, `typingBubble:539-549`, `dot:550-557`, `thinkingText:558-565` |
| **Input bar**: `+` button (focuses input), multiline `TextInput` (max 2000), send button (active/disabled states, spinner while loading) | `260-304` (plus `262-268` → `inputRef.current?.focus()` `265`; input `270-282`; send `284-303`, handler `291`, disabled logic `287-292`) | `inputArea:566-573`, `inputContainer:574-581`, `plusButton:582-593`, `plusText:594-600`, `textInput:601-616`, `sendButton:617-624`, `sendButtonActive:625-630`, `sendButtonDisabled:631-636`, `sendIcon:637-643` |
| Disclaimer footer | `306-309` | `disclaimer:644-650` |

### 3.7 Notes interface → `app/notes.tsx`

| Visual element | JSX | Styles |
|---|---|---|
| Canvas `#0F172A` + status bar | `221-222` | `container:438-441` |
| Keyboard shell | `224-227` | `keyboardContainer:442-444` |
| **Header**: back `‹`, "My Notes" + subtitle, **`+` add button** (resets editor and opens it) | `228-256` (back `231`, add `244-255`, reset+open `246-251`) | `header:445-453`, `backButton:454-461`, `backIcon:462-466`, `headerTextContainer:467-470`, `headerTitle:471-476`, `headerSubtitle:477-481`, `addButton:482-494`, `addIcon:495-500` |
| Scroll body | `258-261` | `content:501-505` |
| **Search bar** 🔍 + clear ✕ (appears when typing) | `262-281` (clear `273-280`) | `searchContainer:506-516`, `searchIcon:517-520`, `searchInput:521-525`, `clearSearch:526-530` |
| **Inline editor card** (shown when `showEditor`): title switches "Edit Note"/"Create New Note", title input, multiline content input, Cancel + Save/Update buttons | `283-327` (title `285-287`, inputs `289-305`, cancel `308-314`, save `316-324`) | `editorCard:531-538`, `editorTitle:539-544`, `titleInput:545-555`, `contentInput:556-567`, `editorButtons:568-572`, `cancelButton:573-580`, `cancelText:581-585`, `saveButton:586-598`, `saveText:599-603` |
| **Loading state** ⏳ | `329-333` | `emptyContainer:604-612`, `emptyIcon:622-624` |
| **Empty state** 📚 + "Create First Note" CTA | `336-359` (CTA `349-357`) | `emptyIconContainer:613-621`, `emptyTitle:625-630`, `emptyDescription:631-638`, `createButton:639-646`, `createButtonText:647-651` |
| **No-search-results state** | `361-369` | same empty styles |
| **Notes list**: count header, then cards with 📝 icon, title (1 line), content (3 lines), ✏️ edit, 🗑️ delete | `371-417` (count `375-378`, map `381-415`, edit `398-404`, delete `406-412`) | `notesHeader:652-657`, `sectionTitle:658-662`, `noteCount:663-671`, `noteCard:672-681`, `noteIconContainer:682-690`, `noteIcon:691-693`, `noteContent:694-696`, `noteTitle:697-702`, `noteText:703-707`, `actionButtons:708-711`, `editButton:712-719`, `deleteButton:720-727`, `actionIcon:728-730` |
| **Study Tip card** 💡 | `421-430` | `infoCard:731-740`, `infoEmoji:741-743`, `infoContent:744-747`, `infoTitle:748-753`, `infoText:754-758` |

### 3.8 Quiz interface → `app/quiz.tsx` (4 mutually exclusive visual states)

State machine driven by `quiz`, `loading`, `showResult`:

| State | Condition | JSX | Styles |
|---|---|---|---|
| **A. Setup form** | `!quiz && !loading` | `166-262` | `setupCard:495-506`, `heroGlowCircle:507-513`, `heroIconWrapper:514-521`, `heroEmoji:522-524`, `title:525-530`, `description:531-538` |
| A1. Topic input | — | `180-190` | `inputGroup:539-541`, `label:542-549`, `input:550-560` |
| A2. Question-count chips **5 / 10 / 15** | map at `196` | `193-220` | `optionsRow:561-564`, `chipButton:565-574`, `chipButtonActive:575-578`, `chipText:579-583`, `chipTextActive:584-588` |
| A3. Difficulty chips **easy / medium / hard** | map at `226`, label capitalization `244` | `223-250` | same chip styles |
| A4. ✨ "Generate Quiz" button → `generateQuiz` | `253-260` (handler `255`) | `primaryButton:589-602`, `primaryButtonIcon:603-606`, `primaryButtonText:607-614` |
| **B. Loading** | `loading` | `267-277` | `loadingCard:615-623`, `loadingGlow:624-632`, `loadingTitle:633-637`, `loadingText:638-646` |
| **C. Question view** | `quiz && current && !showResult` | `282-399` | `quizWrapper:647-649` |
| C1. "Question X of Y" + "Score: N" badges | `285-295` | `quizTopHeader:650-655`, `counterBadge:656-661`, `counterText:662-666`, `scoreBadge:667-674`, `scoreText:675-679` |
| C2. Progress bar (width = question index %) | `298-309` (formula `303-305`) | `progressBackground:680-686`, `progressFill:687-691` |
| C3. Question card | `312-314` | `questionCard:692-699`, `questionText:700-705` |
| C4. **Answer options A–D** with correct/wrong recoloring + ✓/✕ circles | `317-368` (style selection `322-336`, letter `348`, tap `342`, lock `343`, ✓ `354-358`, ✕ `360-364`) | `optionsList:706-709`, `answerButton:710-720`, `correctAnswer:721-731`, `wrongAnswer:732-742`, `optionBadge:743-751`, `optionLetter:752-756`, `correctBadge:757-765`, `wrongBadge:766-774`, `badgeTextWhite:775-779`, `answerText:780-786`, `iconCircleCorrect:787-794`, `iconCircleWrong:795-802`, `iconSymbol:803-809` |
| C5. 💡 Explanation card (appears after answering) | `371-381` | `explanationCard:810-817`, `explanationHeader:818-822`, `explanationEmoji:823-826`, `explanationTitle:827-831`, `explanationText:832-839` |
| C6. Next / "View Final Results" button | `384-397` (label logic `391-393`) | `nextButton:840-848`, `nextButtonText:849-853`, `nextArrow:854-860` |
| **D. Results** | `showResult && quiz` | `404-437` | `resultCard:861-868`, `trophyWrapper:869-879`, `trophyEmoji:880-882`, `resultTitle:883-887`, `resultSubtitle:888-893` |
| D1. Final score `X / Y` + accuracy pill | `415-426` (score `417-419`, % `421-425`) | `scoreContainer:894-903`, `scoreLabel:904-909`, `finalScore:910-915`, `totalQuestions:916-920`, `percentagePill:921-929`, `percentageText:930-934` |
| D2. 🔄 "Create New Quiz" → `restartQuiz` | `428-435` (handler `430`) | `primaryButton:589` (reused) |

Shared chrome: header + back button `144-157` → styles `header:450-458`, `backButton:459-467`, `backIcon:468-472`, `headerTextContainer:473-475`, `headerTitle:476-481`, `headerSubtitle:482-487`; scroll body `159-162` → `content:488-494`.

### 3.9 Study Planner interface → `app/study-planner.tsx` (3 mutually exclusive screens)

| Screen | Condition | JSX | Styles |
|---|---|---|---|
| **Loading** | `authLoading` (`:39`, cleared `:56`) | `281-298` | `loadingContainer:618-624`, `loadingIcon:625-629`, `loadingText:630-637` |
| **Login required** 🔐 + "Go to Login" → `router.replace("/login")` | `!userId` | `304-335` (nav `325`) | `loginContainer:638-644`, `loginIcon:645-649`, `loginTitle:650-656`, `loginText:657-664`, `loginButton:665-671`, `loginButtonText:672-679` |
| **Main UI** | otherwise | `341-599` | — |
| └ Header + back | `358-376` (back `361`) | `header:680-689`, `backButton:690-698`, `backIcon:699-704`, `headerTextContainer:705-709`, `headerTitle:710-716`, `headerSubtitle:717-722` |
| └ `FlatList` shell | `378-382` | `content:723-730` |
| └ **Intro card** 📅 | `387-406` | `introCard:731-740`, `introIcon:741-750`, `calendarIcon:751-754`, `introTextContainer:755-758`, `introTitle:759-764`, `introText:765-773` |
| └ **Progress card**: "Study Progress", `completed / total`, % circle | `410-426` (counts `417`, % `422-424`) | `progressCard:774-791`, `progressLabel:792-797`, `progressNumber:798-804`, `progressCircle:805-813`, `progressPercent:814-821` |
| └ **"Add Study Session" form**: Subject, Date, Duration inputs + ＋ button | `430-484` (inputs `439-445`, `451-457`, `463-469`; button `471-483` → `addSession` `473`) | `sectionTitle:822-829`, `formCard:830-837`, `inputLabel:838-844`, `input:845-856`, `addButton:857-874`, `addButtonIcon:875-881`, `addButtonText:882-889` |
| └ **"My Study Sessions"** header + live count | `488-499` (count `493-498`) | `sessionsHeader:890-895`, `sessionCount:896-908` |
| └ **Session card** (per item): recolors when completed, ✅/📚 emoji, subject, 📅 date, ⏱ duration, **Done/Undo** button, 🗑️ delete | `502-579` (completed styles `504-515`, emoji `517-519`, subject `523-532`, date `534-536`, duration `538-540`, Done/Undo `544-560` → `toggleComplete` `547`, delete `562-576` → `deleteSession` `565`) | `sessionCard:909-919`, `completedCard:920-923`, `sessionIcon:924-933`, `completedIcon:934-937`, `sessionEmoji:938-941`, `sessionInfo:942-945`, `sessionSubject:946-952`, `completedText:953-957`, `sessionDetails:958-963`, `sessionActions:964-969`, `completeButton:970-976`, `completeButtonText:977-982`, `deleteButton:983-991`, `deleteButtonText:992-997` |
| └ **Empty state** 📖 | `580-595` | `emptyContainer:998-1007`, `emptyIcon:1008-1012`, `emptyTitle:1013-1018`, `emptyText:1019-1025` |

### 3.10 PDF Summary interface → `app/pdf-summary.tsx`

Header `146-161` (styles `282-324`); hero 📄 `169-180` (`331-351`); **upload drop-zone** (changes to "Change Selected PDF" + 🔄 once a file is picked) `183-199` (`uploadBox:369-379`, `uploadBoxActive:380-384`, `uploadIconCircle:385-394`, `uploadIcon:395-398`, `uploadTitle:399-404`, `uploadSubtitle:405-413`); **selected-file card** with human-readable size `202-222` (`414-464`, size formatter `127-139`); ✨ **Summarize** button with disabled/loading states `225-245` (`465-505`); **AI Summary card** `248-259` (`506-555`); footer note `261-264` (`infoText:556-563`).

---

<a name="4-firebase-authentication"></a>
## 4. Firebase Authentication

### 4.0 Foundation — one shared `auth` instance

```
firebaseConfig.ts:1-2    import { initializeApp } from "firebase/app"; import { getAuth } from "firebase/auth";
firebaseConfig.ts:4-11   const firebaseConfig = { apiKey, authDomain, projectId: "studymate-ai-d8550",
                                                  storageBucket, messagingSenderId, appId }
firebaseConfig.ts:13     const app = initializeApp(firebaseConfig);   ← runs once at module load
firebaseConfig.ts:15     export const auth = getAuth(app);            ← THE singleton every screen imports
```

**Every consumer of `auth` (6 files, 6 import lines):**

| Consumer | Import line | Firebase APIs used | Call sites |
|---|---|---|---|
| `app/_layout.tsx` | `:13` (`../firebaseConfig`) | `onAuthStateChanged` (imported `:12`) | `:29-35` |
| `app/login.tsx` | `:30` | `signInWithEmailAndPassword` (`:13`), `sendPasswordResetEmail` (`:12`) | `:59-63`, `:94-97` |
| `app/register.tsx` | `:31` | `createUserWithEmailAndPassword` (`:12`), `updateProfile` (`:14`), `signOut` (`:13`) | `:82-86`, `:89-91`, `:94` |
| `app/(tabs)/index.tsx` | `:33` (`../../firebaseConfig`) | `onAuthStateChanged` (`:13`), `signOut` (`:14`) | `:63-72`, `:135` |
| `app/notes.tsx` | `:5` | `onAuthStateChanged` (`:4`), `auth.currentUser` | `:48-57`, `:68` |
| `app/study-planner.tsx` | `:6` | `onAuthStateChanged` (`:5`) | `:46-58` |

`app/ai-chat.tsx`, `app/quiz.tsx`, `app/pdf-summary.tsx` import **no** Firebase — they are auth-agnostic (consequence: §13.5).

Package version: `package.json:34` → `"firebase": "^12.18.0"`.

### 4.1 User Registration → `app/register.tsx:54-116` (`handleRegister`)

Trigger: **"Create Account" button** `app/register.tsx:278-302`, `onPress={handleRegister}` at `:283`, `disabled={isLoading}` at `:284`.

```
handleRegister()                                              register.tsx:54
│
├─ GUARD 1  empty fields?  !name.trim() || !email.trim()
│           || !password || !confirmPassword  → alert         :56-64
├─ GUARD 2  password !== confirmPassword → alert              :67-70
├─ GUARD 3  password.length < 6 → alert                       :73-76
├─ setIsLoading(true)   → button swaps to spinner (:287-288)  :78
│
├─ try
│   ├─ STEP 1  createUserWithEmailAndPassword(auth, email.trim(), password)
│   │          → returns userCredential                       :82-86
│   │          (auth = firebaseConfig.ts:15)
│   │
│   ├─ STEP 2  updateProfile(userCredential.user, { displayName: name.trim() })
│   │          → THIS is where the "user display name" is born :89-91
│   │
│   ├─ STEP 3  signOut(auth)   → deliberately logs the fresh account out
│   │          so the user must log in manually                :94
│   │
│   ├─ STEP 4  alert("Account created successfully! Please login to continue.")  :97
│   └─ STEP 5  router.replace("/login")   (replace, not push → no back-stack
│              loop back into Register)                        :100
│
├─ catch  error-code → human message mapping                  :101-112
│   ├─ auth/email-already-in-use → "This email is already registered."   :104-105
│   ├─ auth/invalid-email        → "Please enter a valid email address." :106-107
│   ├─ auth/weak-password        → "Password must be at least 6 characters." :108-109
│   └─ fallback                  → "Registration failed. Please try again."  :110-111
│
└─ finally  setIsLoading(false)                               :113-115
```

**Side effect you must know about:** `signOut(auth)` at `:94` fires the root listener `app/_layout.tsx:29-35` with `currentUser = null`, setting `user = null` (`:32`) and `loading = false` (`:33`). The guard at `app/_layout.tsx:53-56` only redirects when the current route is `(tabs)`, and we are on `register`, so **no automatic redirect happens** — the explicit `router.replace("/login")` at `:100` is what moves the user. This is exactly the intent documented in the comment block `app/_layout.tsx:68-78`.

**Where the `displayName` is consumed later:**
```
register.tsx:89-91  updateProfile({ displayName })   ── Firebase Auth profile
        ▼
(tabs)/index.tsx:63-72   onAuthStateChanged → currentUser?.displayName?.trim() || "Student"  (:66-67)
        ▼
(tabs)/index.tsx:69      setUserName(name)
        ▼
(tabs)/index.tsx:242     "Hello, {userName}!"         (greeting text)
(tabs)/index.tsx:189-205 getInitials()                (1 name → 1 letter :195-199;
                                                       2+ names → first + last letter :201-204)
        ▼
(tabs)/index.tsx:255     {getInitials()}  rendered inside the avatar circle (:253-257)
```

### 4.2 Login → `app/login.tsx:50-84` (`handleLogin`)

Trigger: **Login button** `app/login.tsx:212-226`, `onPress={handleLogin}` at `:214`.

```
handleLogin()                                                 login.tsx:50
├─ GUARD  !email.trim() || !password → alert                  :51-54
├─ setIsLoading(true)  → spinner replaces label (:218-219)    :56
├─ try
│   ├─ await signInWithEmailAndPassword(auth, email.trim(), password)   :59-63
│   ├─ alert("Login successful!")                             :65
│   └─ router.replace("/(tabs)")   → lands on Home Dashboard  :66
│        (replace ⇒ Login is removed from the back stack; Android
│         hardware back cannot return to the login form)
├─ catch  error-code mapping                                  :67-80
│   ├─ auth/user-not-found     → "No account found with this email."  :70-71
│   ├─ auth/wrong-password     → "Incorrect password."                :72-73
│   ├─ auth/invalid-email      → "Please enter a valid email address." :74-75
│   ├─ auth/invalid-credential → "Invalid email or password."         :76-77
│   └─ fallback                → "Login failed. Please try again."    :78-79
└─ finally setIsLoading(false)                                :81-83
```

**Correlation with the root listener:** the successful `signInWithEmailAndPassword` (`:59`) makes `onAuthStateChanged` (`app/_layout.tsx:29`) fire with the user object → `setUser(currentUser)` (`:32`). The guard effect (`:41-79`) re-runs; current segment is `login`, so `inTabs` (`:46`) and `inIndex` (`:47`) are both `false` → **no redirect from the guard**. The explicit `router.replace("/(tabs)")` at `login.tsx:66` is the only thing that navigates. Both mechanisms are intentionally non-overlapping (comment `app/_layout.tsx:68-78`).

### 4.3 Logout / Sign Out → `app/(tabs)/index.tsx:121-153` (`handleSignOut`)

Trigger: **Sign Out button** in the dashboard header, `app/(tabs)/index.tsx:263-277`, `onPress={handleSignOut}` at `:265`.

```
handleSignOut()                                               (tabs)/index.tsx:121
└─ Alert.alert("Sign Out", "Are you sure you want to sign out?", [   :122-125
     { text: "Cancel",    style: "cancel" }                     :126-129
     { text: "Sign Out",  style: "destructive", onPress: async () => {  :130-133
         try {
           await signOut(auth);          ← firebaseConfig.ts:15  :135
           router.replace("/login");     ← explicit navigation   :137
         } catch (error) {
           console.error(...)                                    :139-142
           Alert.alert("Sign Out Failed", "Something went wrong. Please try again.")  :144-147
         }
     }}
   ])
```

**Belt-and-braces:** `signOut(auth)` (`:135`) also triggers `app/_layout.tsx:29-35` → `setUser(null)` → guard re-runs → `!user && inTabs` is `true` (`:53`) → `router.replace("/login")` (`:54`). So even if the explicit `:137` were removed, the guard would still eject the user. Both paths converge on `/login`.

**Data safety on logout:** Notes and Planner data are **not** deleted — it stays in AsyncStorage under the old UID's key and reappears on the next login with the same account (§11). In-memory React state, however, is reset: `app/notes.tsx:54-55` (`setUserId(""); setNotes([])`) and `app/study-planner.tsx:52-53` (`setUserId(null); setSessions([])`).

### 4.4 Forgot Password → `app/login.tsx:87-113` (`handleForgotPassword`)

Trigger: **"Forgot Password?" link** `app/login.tsx:203-209`, `onPress={handleForgotPassword}` at `:205`. It is a link inside the login card, not a separate screen.

```
handleForgotPassword()                                        login.tsx:87
├─ GUARD  !email.trim() → alert("Please enter your email first.")   :88-91
│         (reuses whatever is typed in the Email field :162-171)
├─ try
│   ├─ await sendPasswordResetEmail(auth, email.trim())       :94-97
│   └─ alert("Password reset email sent! Please check your email inbox.")  :99-101
└─ catch                                                      :102-112
    ├─ auth/user-not-found → "No account found with this email."     :105-106
    ├─ auth/invalid-email  → "Please enter a valid email address."   :107-108
    └─ fallback            → "Could not send password reset email."  :109-110
```

The actual password-change UI is **Firebase's hosted page** (opened from the email link) — there is no reset screen in this repo, which is correct for `sendPasswordResetEmail`.
Prerequisite in the Firebase console: **Authentication → Sign-in method → Email/Password = Enabled**, and a mail template configured.

### 4.5 User display name — full lifecycle

| Stage | Location | Detail |
|---|---|---|
| Collected | `app/register.tsx:45` (`name` state), input `:170-178`, `autoCapitalize="words"` `:176` | Full Name field |
| Validated | `app/register.tsx:56-64` | non-empty after `.trim()` |
| Persisted | `app/register.tsx:89-91` | `updateProfile(userCredential.user, { displayName: name.trim() })` |
| Read (dashboard) | `app/(tabs)/index.tsx:66-67` | `currentUser?.displayName?.trim() \|\| "Student"` — fallback string `"Student"` |
| Stored in state | `app/(tabs)/index.tsx:56` (`useState("Student")`), set `:69` | |
| Rendered | `app/(tabs)/index.tsx:241-243` | `Hello, {userName}!` |
| Derived | `app/(tabs)/index.tsx:189-205` → rendered `:255` | Initials in the avatar |

No other screen reads `displayName`. Changing the fallback word means editing `app/(tabs)/index.tsx:56` **and** `:67`.

### 4.6 Authentication-based screen navigation (the route guard)

**This is the heart of the protection logic: `app/_layout.tsx:41-79`.**

```
RootLayout()                                                  app/_layout.tsx:18
├─ colorScheme = useColorScheme()                             :19   (hooks/use-color-scheme.ts:1)
├─ router   = useRouter()                                     :21
├─ segments = useSegments()   ← live route array, e.g. ["(tabs)"] or ["login"]  :22
├─ const [user, setUser]       = useState<any>(null)          :24
├─ const [loading, setLoading] = useState(true)               :25   ← starts TRUE = gate closed
│
├─ EFFECT A — Firebase auth listener                          :28-38
│    onAuthStateChanged(auth, (currentUser) => {
│        setUser(currentUser)          :32
│        setLoading(false)             :33   ← gate opens once Firebase has answered
│    })                                                       :29-35
│    return unsubscribe                :37   ← cleanup on unmount
│    deps: []                          :38   ← subscribe exactly once
│
├─ EFFECT B — the guard                                       :41-79
│    if (loading) return;              :42   ← never redirect while auth is unknown
│    const currentRoute = segments[0]  :44
│    const inTabs  = currentRoute === "(tabs)"   :46
│    const inIndex = currentRoute === "index"    :47
│
│    RULE 1  if (!user && inTabs)  → router.replace("/login");  return;   :53-56
│            "Signed out? You may not sit on Home."
│
│    RULE 2  if (user && inIndex)  → router.replace("/(tabs)"); return;   :63-66
│            "Signed in? Skip the Welcome screen, go Home."
│
│    RULE 3  (deliberate no-op)      :68-78
│            Login/Register are NEVER auto-redirected; those screens
│            navigate themselves (login.tsx:66, register.tsx:100).
│    deps: [user, loading, segments]   :79   ← re-evaluate on every auth/route change
│
├─ if (loading) → full-screen ActivityIndicator on #F7F9FC     :82-98
│    (prevents any flash of Login or Home before Firebase answers)
│
└─ render ThemeProvider + Stack                                :100-140
```

**Guard truth table:**

| `user` | `segments[0]` | Result | Line |
|---|---|---|---|
| `null` (signed out) | `(tabs)` | → `replace("/login")` | `:53-56` |
| `null` | `index` | stays on Welcome | (no rule) |
| `null` | `login` / `register` | stays (screens self-manage) | `:68-78` |
| `null` | `notes` / `quiz` / `ai-chat` / `pdf-summary` / `study-planner` | **NOT redirected** — see §13.5 | (no rule) |
| user object | `index` | → `replace("/(tabs)")` | `:63-66` |
| user object | `login` / `register` | stays (comment `:68-78`) | — |
| user object | `(tabs)` | stays | — |
| *anything* | *anything* while `loading === true` | guard returns early; spinner shown | `:42`, `:82-98` |

### 4.7 Firebase console checklist (nothing in the repo does this for you)

1. Project `studymate-ai-d8550` (`firebaseConfig.ts:7`) → **Authentication → Sign-in method → Email/Password → Enable**.
2. **Authentication → Settings → Authorized domains**: add your dev domain if you also test on web (`package.json:10`, `app.json:25-28`).
3. **Templates → Password reset**: customize the email users receive from `app/login.tsx:94-97`.
4. `firebaseConfig.ts:5` holds a **committed** web API key — restrict it and/or enable App Check (see §13.7).

---

<a name="5-notes-management"></a>
## 5. Notes Management → `app/notes.tsx` (758 lines)

### 5.1 Data model & state

```
type Note = { id: string; title: string; content: string }    notes.tsx:20-24
NotesScreen()                                                 notes.tsx:26
├─ notes: Note[]                    :29    the in-memory list = single source of truth for render
├─ searchText: string               :30    drives filteredNotes (:211-218)
├─ showEditor: boolean              :32    toggles the inline editor card (:283-327)
├─ editingNoteId: string | null     :33    null = CREATE mode, string = EDIT mode (:137, :166, :286, :322)
├─ title / content: string          :35-36 editor field buffers
├─ loadingNotes: boolean            :38    drives the ⏳ state (:329-333)
└─ userId: string                   :39    default "guest_user"  ← see §13.8
```

### 5.2 Bootstrap: how notes become user-specific

Two mechanisms run together inside one `useFocusEffect` (so notes refresh **every time the screen regains focus**, including when you come back from another screen):

```
useFocusEffect(useCallback(() => {                            notes.tsx:44-61
│
├─ (1) initNotes()                       ← immediate, synchronous-ish read   :46
│      └─ initNotes()                                    notes.tsx:63-86
│         ├─ setLoadingNotes(true)                       :65
│         ├─ const currentUser = auth.currentUser        :68   (firebaseConfig.ts:15)
│         ├─ IF logged in:
│         │    activeUserId = currentUser.uid            :71
│         │    setUserId(activeUserId)                   :72
│         │    await loadNotesForUser(activeUserId)      :73
│         └─ ELSE (no user):
│              setUserId("")  ; setNotes([])             :76-77
│              ← comment at :75 "never show another account's notes"
│         finally setLoadingNotes(false)                 :83-85
│
├─ (2) onAuthStateChanged(auth, (currentUser) => {...})  ← live subscription :48-57
│      ├─ IF user:  setUserId(uid) (:51) → loadNotesForUser(uid) (:52)
│      └─ ELSE:     setUserId("") (:54) → setNotes([]) (:55)
│
└─ return unsubscribe                                    :59   cleanup on blur
   deps: []                                              :60
```

**Load:**
```
loadNotesForUser(currentUserId)                             notes.tsx:88-102
├─ storageKey = `@studymate_notes_${currentUserId}`         :90    ← UID-partitioned key
├─ savedNotes = await AsyncStorage.getItem(storageKey)      :91
├─ savedNotes ? setNotes(JSON.parse(savedNotes))            :93-94
│             : setNotes([])                                :95-97
└─ catch → console.error (:99) + Alert "Could not load your notes." (:100)
```

**Save (single writer used by create / edit / delete):**
```
saveNotesToStorage(updatedNotes, currentUserId)             notes.tsx:104-118
├─ storageKey = `@studymate_notes_${currentUserId}`         :109   (identical string to :90)
├─ await AsyncStorage.setItem(storageKey, JSON.stringify(updatedNotes))  :110-113
└─ catch → console.error (:115) + Alert "Could not save your notes." (:116)
```
> Design note: the whole array is rewritten on every mutation (no per-note keys). Simple and atomic; fine for hundreds of notes.

### 5.3 CREATE a note

```
UI ENTRY POINTS (two):
  • header "+" button      notes.tsx:244-255 → resets title/content/editingNoteId, setShowEditor(true)  :246-251
  • empty-state CTA        notes.tsx:349-357 → setShowEditor(true)                                      :351
        ▼
Editor card rendered       notes.tsx:283-327  (condition: showEditor)
  ├─ heading shows "Create New Note"  :285-287  (editingNoteId === null)
  ├─ title TextInput ↔ setTitle       :289-295
  ├─ content TextInput ↔ setContent   :297-305  (multiline :303, textAlignVertical top :304)
  ├─ Cancel → cancelEditor()          :308-314
  └─ Save   → saveNote()              :316-324  (label "💾 Save" :322)
        ▼
saveNote()                 notes.tsx:120-171
  ├─ activeUserId = userId || "guest_user"                 :121
  ├─ trimmedTitle / trimmedContent                         :122-123
  ├─ VALIDATE title non-empty → Alert "Title Required"      :125-128
  ├─ VALIDATE content non-empty → Alert "Content Required"  :130-133
  ├─ editingNoteId is null ⇒ CREATE branch                  :147-155
  │     newNote = { id: Date.now().toString(), title, content }   :148-152
  │     updatedNotes = [newNote, ...notes]   ← newest first       :154
  ├─ setNotes(updatedNotes)          ← optimistic UI update :157
  ├─ await saveNotesToStorage(updatedNotes, activeUserId)   :158  → :104-118 → AsyncStorage
  ├─ reset title/content/editingNoteId/showEditor           :160-163
  └─ Alert "Note Saved" / "Your note has been saved successfully." :165-170
        ▼
Re-render: filteredNotes (:211-218) → list map (:381-415) shows the new card
```
`id` generation = `Date.now().toString()` (`:149`) — millisecond timestamp as string.

### 5.4 EDIT a note

```
✏️ button on a note card   notes.tsx:398-404 → onPress={() => editNote(note)}  :400
        ▼
editNote(note)             notes.tsx:173-178
  ├─ setTitle(note.title)         :174
  ├─ setContent(note.content)     :175
  ├─ setEditingNoteId(note.id)    :176   ← flips the screen into EDIT mode
  └─ setShowEditor(true)          :177
        ▼
Editor card re-renders with heading "Edit Note" (:286) and button "💾 Update" (:322)
        ▼
saveNote()                 notes.tsx:120-171  (same function as CREATE)
  ├─ editingNoteId is truthy ⇒ EDIT branch                  :137-146
  │     updatedNotes = notes.map(note =>
  │        note.id === editingNoteId
  │          ? { ...note, title: trimmedTitle, content: trimmedContent }   :140-144
  │          : note )                                                        :145
  │     ← order preserved, all other notes untouched
  ├─ setNotes(updatedNotes)                                 :157
  ├─ await saveNotesToStorage(...)                          :158
  ├─ reset (incl. setEditingNoteId(null) :162)              :160-163
  └─ Alert "Note Updated" / "Your note has been updated."    :165-170
```
The create/edit fork is decided at exactly one place: `if (editingNoteId)` — `app/notes.tsx:137`. The alert wording fork: `:166-169`.

### 5.5 DELETE a note

```
🗑️ button on a note card   notes.tsx:406-412 → onPress={() => deleteNote(note.id)}  :408
        ▼
deleteNote(id)             notes.tsx:180-202
└─ Alert.alert("Delete Note", "Are you sure you want to delete this note?", [   :181-184
     { text: "Cancel", style: "cancel" }                             :185-188
     { text: "Delete", style: "destructive", onPress: async () => {  :189-192
         activeUserId  = userId || "guest_user"                      :193
         updatedNotes  = notes.filter(note => note.id !== id)        :194
         setNotes(updatedNotes)                                      :196
         await saveNotesToStorage(updatedNotes, activeUserId)        :197
     }}
   ])                                                                :198-201
```
No confirmation-of-deletion alert afterwards; the card simply disappears because `filteredNotes` (`:211-218`) recomputes from `notes`.

### 5.6 Cancel & search

```
cancelEditor()             notes.tsx:204-209   ← clears title (:205), content (:206),
                                                  editingNoteId (:207), closes editor (:208)
   wired at                notes.tsx:310

filteredNotes              notes.tsx:211-218   ← derived on EVERY render (not memoized)
   search = searchText.toLowerCase()           :212
   match if title OR content contains search   :214-217
   search box UI           notes.tsx:262-281   (state :30, clear ✕ :273-280)
   "N note(s)" counter     notes.tsx:375-378   (pluralization :377)
   no-results state        notes.tsx:361-369
```

### 5.7 Notes ↔ Auth correlation summary

```
firebaseConfig.ts:15  auth
        │
        ├─ notes.tsx:68   auth.currentUser.uid  ──┐
        └─ notes.tsx:48   onAuthStateChanged  ────┤
                                                  ▼
                              notes.tsx:39/51/72  userId
                                                  ▼
                    notes.tsx:90 & :109   `@studymate_notes_${userId}`
                                                  ▼
                              AsyncStorage  (device-local, per account)
```
Log out (dashboard `:135`) → `notes.tsx:53-55` clears `userId` and `notes` → screen shows the empty state, never another user's data. Log in as a different account → different `uid` → different storage key → different note list. **That is the entire multi-tenant mechanism.**

---

<a name="6-study-planner"></a>
## 6. Study Planner → `app/study-planner.tsx` (1025 lines) + dashboard mirror in `app/(tabs)/index.tsx`

### 6.1 Data model & state

```
type StudySession = {                                        study-planner.tsx:22-28
  id: string; subject: string; date: string; duration: string; completed: boolean
}
   ▲▲▲ IDENTICAL type re-declared in app/(tabs)/index.tsx:35-41
       (duplicated, not imported — see §13.9)

StudyPlannerScreen()                                         study-planner.tsx:30
├─ subject / date / duration : string     :33-35   form buffers (free text, no date picker)
├─ sessions: StudySession[]               :37      the list
├─ userId: string | null                  :38      Firebase uid (null = signed out)
└─ authLoading: boolean                   :39      gates the loading screen (:281-298)
```

### 6.2 Bootstrap & storage key (the cross-file contract)

```
EFFECT A — Firebase user                                     study-planner.tsx:45-61
  onAuthStateChanged(auth, currentUser => {
     currentUser ? setUserId(currentUser.uid)   :50
                 : setUserId(null) + setSessions([])   :52-53
     setAuthLoading(false)                :56      ← releases the loading screen
  })
  return unsubscribe                      :60
  deps: []                                :61

EFFECT B — load once uid is known                            study-planner.tsx:67-73
  if (!userId) return                     :68-70
  loadSessions(userId)                    :72
  deps: [userId]                          :73

getStorageKey(uid) => `studymate_study_sessions_${uid}`      study-planner.tsx:75-77
        ▲
        └── MUST stay byte-identical to app/(tabs)/index.tsx:86
            (the dashboard hard-codes the same template string instead of importing it)

loadSessions(uid)                                            study-planner.tsx:79-101
├─ storageKey = getStorageKey(uid)                           :81
├─ savedSessions = await AsyncStorage.getItem(storageKey)    :83-84
├─ savedSessions ? parse (:87) → Array.isArray check (:89) → setSessions (:90)
│                            → else setSessions([]) (:92)
│                : setSessions([])                           :95
└─ catch → console.error (:98) + setSessions([]) (:99)

saveSessions(updatedSessions)                                study-planner.tsx:107-135
├─ if (!userId) → Alert "Login Required" / "Please login first." + return   :111-117
├─ storageKey = getStorageKey(userId)                        :119
├─ await AsyncStorage.setItem(storageKey, JSON.stringify(updatedSessions))  :121-124
├─ setSessions(updatedSessions)   ← state updated AFTER a successful write  :126
└─ catch → console.error (:128) + Alert "Could not save your study session." (:130-133)
```
> Note the ordering difference vs Notes: here `setSessions` happens **after** the write succeeds (`:126`), in Notes it happens **before** (`app/notes.tsx:157`). Both end up consistent; the planner version is the safer pattern.

### 6.3 CREATE a study session

```
Form UI                                                      study-planner.tsx:434-484
  ├─ Subject  TextInput ↔ setSubject   :439-445  (placeholder "e.g. Data Structures" :441)
  ├─ Date     TextInput ↔ setDate      :451-457  (placeholder "e.g. 30 August 2026" :453)
  ├─ Duration TextInput ↔ setDuration  :463-469  (placeholder "e.g. 2 hours" :465)
  └─ "＋ Add Study Session" button     :471-483 → onPress={addSession} :473
        ▼
addSession()                                                 study-planner.tsx:141-197
├─ GUARD !userId       → Alert "Login Required"              :142-148
├─ GUARD !subject.trim() → Alert "Missing Subject"           :150-156
├─ GUARD !date.trim()    → Alert "Missing Date"              :158-164
├─ GUARD !duration.trim()→ Alert "Missing Duration"          :166-172
├─ newSession = { id: Date.now().toString(), subject, date, duration, completed: false }  :174-180
├─ updatedSessions = [newSession, ...sessions]   ← newest first                              :182-185
├─ await saveSessions(updatedSessions)           → :107-135 → AsyncStorage + setSessions     :187
├─ clear the three inputs                        :189-191
└─ Alert "Success" / "Study session added successfully!"     :193-196
```

### 6.4 COMPLETE / UNDO a session

```
"Done" / "Undo" button per card    study-planner.tsx:544-560
  label logic: item.completed ? "Undo" : "Done"      :556-558
  onPress={() => toggleComplete(item.id)}            :546-548
        ▼
toggleComplete(id)                                   study-planner.tsx:203-223
├─ GUARD !userId → Alert "Login Required"            :204-210
├─ updatedSessions = sessions.map(session =>
│     session.id === id ? { ...session, completed: !session.completed } : session)   :212-220
└─ await saveSessions(updatedSessions)               :222   → persists + setSessions (:126)
        ▼
Visual feedback (all driven by item.completed):
  • card recolor      :504-508  → styles.completedCard   :920-923
  • icon recolor      :510-515  → styles.completedIcon   :934-937
  • emoji ✅ / 📚     :517-519
  • subject strike-thru styling  :523-532 → styles.completedText :953-957
  • progress card recomputes     :410-426 (completedCount :266-268, % :270-275)
```
It is a **toggle**, not a one-way complete — pressing "Undo" flips `completed` back to `false` and the dashboard numbers follow.

### 6.5 DELETE a session

```
🗑️ button per card     study-planner.tsx:562-576 → onPress={() => deleteSession(item.id)}  :564-566
        ▼
deleteSession(id)      study-planner.tsx:229-260
├─ GUARD !userId → Alert "Login Required"            :230-236
└─ Alert.alert("Delete Session", "Are you sure…", [   :238-241
     { text:"Cancel", style:"cancel" }                :242-245
     { text:"Delete", style:"destructive", onPress: async () => {   :246-249
         updatedSessions = sessions.filter(s => s.id !== id)        :250-253
         await saveSessions(updatedSessions)                        :255
     }}
   ])                                                 :256-259
```

### 6.6 Remaining sessions & progress (both surfaces)

**Inside the planner:**
```
completedCount      = sessions.filter(s => s.completed).length        study-planner.tsx:266-268
progressPercentage  = sessions.length > 0
                        ? Math.round((completedCount / sessions.length) * 100)
                        : 0                                           study-planner.tsx:270-275
Rendered:  "{completedCount} / {sessions.length}"                     :416-418
           "{progressPercentage}%"  in the circle                     :421-425
           "{sessions.length} session(s)" in the list header          :493-498
"Remaining" is NOT shown as a number here — only total & completed.
```

**On the Home Dashboard (`app/(tabs)/index.tsx:170-184`):**
```
totalSessions      = sessions.length                                   :170
completedSessions  = sessions.filter(s => s.completed).length           :172-174
remainingSessions  = totalSessions - completedSessions                  :176-177   ← the "Remaining sessions" figure
progressPercent    = totalSessions > 0
                       ? Math.round((completedSessions / totalSessions) * 100)
                       : 0                                              :179-184
Rendered in 4 places:
  • hero % circle            :346-350   ({progressPercent}%)
  • hero bar width           :353-362   (width: `${progressPercent}%`  :358)
  • hero footer              :364-372   ("{completedSessions} completed" :366, "{remainingSessions} remaining" :370)
  • 3-up stats grid          :649-721   (Total :665-667, Completed :689-691, Remaining :713-715)
Dynamic hero subtitle:       :339-343   (totalSessions > 0 ? "Keep going…" : "Start your first study session!")
```

### 6.7 "Today's Progress" — important accuracy note

The label **"Today's Progress"** is rendered at `app/(tabs)/index.tsx:335-337`, but the numbers behind it (`:170-184`) are computed from **all** sessions in storage — there is **no date filtering anywhere**. `StudySession.date` is a **free-text string** typed by the user (`app/study-planner.tsx:451-457`, placeholder `"e.g. 30 August 2026"`), never parsed, never compared to `new Date()`. So the card is really "Overall Progress". To make it genuinely today-only, see the fix recipe in §13.10.

### 6.8 Planner → Dashboard live sync (the key correlation)

```
[Planner screen]                                  [Home Dashboard]
addSession/toggleComplete/deleteSession
   study-planner.tsx:187 / :222 / :255
        ▼
saveSessions()  study-planner.tsx:107-135
        ▼
AsyncStorage.setItem("studymate_study_sessions_<uid>")   :121-124
        ▼                                                  
        ╰──────────────── user taps ‹ back (:361) ─────────►  useFocusEffect fires
                                                              (tabs)/index.tsx:108-116
                                                                   │
                                                                   ▼
                                                    loadStudySessions(userId)  :80-106
                                                    AsyncStorage.getItem(same key)  :86-87
                                                    JSON.parse (:90) → setSessions (:92)
                                                                   │
                                                                   ▼
                                                    recompute :170-184 → re-render
                                                    hero % (:348), bar (:358),
                                                    completed (:366), remaining (:370),
                                                    stats grid (:666, :690, :714)
```
`useFocusEffect` (`app/(tabs)/index.tsx:108`, imported `:11`) is precisely what makes the dashboard refresh when you return from the planner — a plain `useEffect` would not. Its dependency array `[userId, loadStudySessions]` (`:115`) also guarantees a reload if the signed-in account changes.

**Shared key contract (must never drift):**

| Producer | Consumer | Key template |
|---|---|---|
| `app/study-planner.tsx:76` | `app/(tabs)/index.tsx:86` | `` `studymate_study_sessions_${uid}` `` |
| `app/notes.tsx:90` & `:109` | `app/notes.tsx:91` (self) | `` `@studymate_notes_${uid}` `` |

Note the inconsistency: planner/dashboard keys have **no `@` prefix**, notes keys **do**. Harmless, but it means you cannot grep for one prefix to find all keys (see §13.11).

---

<a name="7-navigation--app-structure"></a>
## 7. Navigation & App Structure

### 7.1 Expo Router file-based routing — file ⇒ route table

Entry point: `package.json:3` → `"main": "expo-router/entry"`. Plugin registered: `app.json:30`. Typed routes enabled: `app.json:46`.

| File on disk | Route | Declared in root Stack? | Component |
|---|---|---|---|
| `app/_layout.tsx` | *(root layout, no route)* | — | `RootLayout` `:18` |
| `app/index.tsx` | `/` | ✅ `app/_layout.tsx:109-112` | `WelcomeScreen` `:22` |
| `app/login.tsx` | `/login` | ✅ `:114-117` | `LoginScreen` `:32` |
| `app/register.tsx` | `/register` | ✅ `:119-122` | `RegisterScreen` `:33` |
| `app/(tabs)/_layout.tsx` | *(tab layout)* | ✅ as group `(tabs)` `:124-127` | `TabLayout` `:9` |
| `app/(tabs)/index.tsx` | `/(tabs)` → Home tab | via group | `HomeScreen` `:43` |
| `app/(tabs)/explore.tsx` | `/(tabs)/explore` → Explore tab | via group | `TabTwoScreen` `:12` |
| `app/notes.tsx` | `/notes` | ⚠️ auto-registered, **not** declared | `NotesScreen` `:26` |
| `app/study-planner.tsx` | `/study-planner` | ⚠️ auto-registered | `StudyPlannerScreen` `:30` |
| `app/ai-chat.tsx` | `/ai-chat` | ⚠️ auto-registered | `AIChatScreen` `:23` |
| `app/quiz.tsx` | `/quiz` | ⚠️ auto-registered | `QuizScreen` `:29` |
| `app/pdf-summary.tsx` | `/pdf-summary` | ⚠️ auto-registered | `PDFSummaryScreen` `:23` |
| `app/modal.tsx` | `/modal` | ✅ `:129-135` (`presentation: "modal"`) | `ModalScreen` `:7` |
| `app/api/chat+api.ts` | `/api/chat` (API route) | n/a | **empty file** — §13.1 |

`(tabs)` uses parentheses = **route group**: it groups screens without adding a URL segment, so Home is reachable as `/(tabs)` (`app/_layout.tsx:64`, `app/login.tsx:66`).

The root navigator: `app/_layout.tsx:108` → `<Stack initialRouteName="index">` wrapped in `ThemeProvider` (`:101-107`) with `<StatusBar style="auto" />` (`:138`). All Stack screens use `headerShown: false` (`:111, :116, :121, :126`) because every screen draws its own custom header.

### 7.2 Tab navigator → `app/(tabs)/_layout.tsx`

```
TabLayout()                                                  :9
├─ colorScheme = useColorScheme()                            :10   (hooks/use-color-scheme.ts:1)
└─ <Tabs screenOptions={{
      tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,   :15  → constants/theme.ts:15 (light #0a7ea4)
                                                                        → constants/theme.ts:23 (dark  #fff)
      headerShown: false,                                            :16
      tabBarButton: HapticTab,                                       :17  → components/haptic-tab.tsx:5-18
   }}>
   ├─ <Tabs.Screen name="index"   title 'Home'    icon house.fill>       :19-25  → components/ui/icon-symbol.tsx:28-41
   └─ <Tabs.Screen name="explore" title 'Explore' icon paperplane.fill>  :26-32
```
Only **2 tabs** exist. Notes / Planner / Chat / Quiz / PDF are **stack screens pushed on top of the tab navigator**, not tabs — that is why each of them renders its own `‹` back button.

### 7.3 Every navigation call in the app (complete inventory)

| # | From (file:line) | Trigger | Call | To |
|---|---|---|---|---|
| 1 | `app/index.tsx:96` | "Get Started" button `:94-101` | `router.push("/login")` | `/login` |
| 2 | `app/login.tsx:233` | "Register" link `:232-237` | `router.push("/register")` | `/register` |
| 3 | `app/register.tsx:309` | "Login" link `:308-313` | `router.push("/login")` | `/login` |
| 4 | `app/register.tsx:100` | after successful registration `:82-97` | `router.replace("/login")` | `/login` (stack cleared) |
| 5 | `app/login.tsx:66` | after successful sign-in `:59-65` | `router.replace("/(tabs)")` | Home Dashboard |
| 6 | `app/_layout.tsx:54` | guard RULE 1 `:53` | `router.replace("/login")` | `/login` |
| 7 | `app/_layout.tsx:64` | guard RULE 2 `:63` | `router.replace("/(tabs)")` | Home Dashboard |
| 8 | `app/(tabs)/index.tsx:404` | AI Chat card `:402-445` | `router.push("/ai-chat")` | `/ai-chat` |
| 9 | `app/(tabs)/index.tsx:451` | PDF card `:448-494` | `router.push("/pdf-summary")` | `/pdf-summary` |
| 10 | `app/(tabs)/index.tsx:499` | Quiz card `:497-541` | `router.push("/quiz")` | `/quiz` |
| 11 | `app/(tabs)/index.tsx:546` | Notes card `:544-587` | `router.push("/notes")` | `/notes` |
| 12 | `app/(tabs)/index.tsx:596` | Planner banner `:593-632` | `router.push("/study-planner")` | `/study-planner` |
| 13 | `app/(tabs)/index.tsx:137` | Sign Out confirm `:130-149` | `router.replace("/login")` | `/login` |
| 14 | `app/ai-chat.tsx:191` | header `‹` `:189-195` | `router.back()` | previous (Home) |
| 15 | `app/notes.tsx:231` | header `‹` `:229-235` | `router.back()` | previous (Home) |
| 16 | `app/pdf-summary.tsx:149` | header `‹` `:147-153` | `router.back()` | previous (Home) |
| 17 | `app/quiz.tsx:147` | header `‹` `:145-151` | `router.back()` | previous (Home) |
| 18 | `app/study-planner.tsx:361` | header `‹` `:359-365` | `router.back()` | previous (Home) |
| 19 | `app/study-planner.tsx:325` | "Go to Login" on the locked screen `:323-331` | `router.replace("/login")` | `/login` |
| 20 | `app/modal.tsx:11` | `<Link href="/" dismissTo>` | declarative Link | `/` |

`push` = adds to the stack (back button works). `replace` = swaps the current entry (no going back). `back` = pops. Router hooks imported at `app/index.tsx:10`, `app/login.tsx:10`, `app/register.tsx:10`, `app/(tabs)/index.tsx:11`, `app/notes.tsx:2`, `app/study-planner.tsx:2`, `app/ai-chat.tsx:1`, `app/quiz.tsx:1`, `app/pdf-summary.tsx:2`, `app/_layout.tsx:6`.

### 7.4 Screen-protection status (who is actually guarded)

| Route | Root guard (`app/_layout.tsx:41-79`) | Own in-screen gate | Net effect |
|---|---|---|---|
| `/` | RULE 2 → Home if signed in (`:63-66`) | — | Welcome auto-skips for logged-in users |
| `/login`, `/register` | intentionally not redirected (`:68-78`) | — | reachable while signed in (minor UX nit) |
| `/(tabs)` Home | **RULE 1** (`:53-56`) | — | fully protected |
| `/(tabs)/explore` | covered by the `(tabs)` group segment | — | protected |
| `/study-planner` | ❌ not covered | ✅ `:304-335` renders "Login Required" + `:325` Go to Login; write ops also guard at `:111-117`, `:142-148`, `:204-210`, `:230-236` | **effectively protected** (own gate) |
| `/notes` | ❌ not covered | ⚠️ partial: reads clear when signed out (`:53-55`, `:75-77`) but writes fall back to `"guest_user"` (`:121`, `:193`) | **not protected** — §13.5/§13.8 |
| `/ai-chat`, `/quiz`, `/pdf-summary` | ❌ not covered | ❌ none (no Firebase import) | **not protected** — usable signed-out |

### 7.5 Android app integration

| Concern | Location | Value / effect |
|---|---|---|
| App display name | `app.json:3` | `"StudyMate AI"` (launcher label) |
| Slug | `app.json:4` | `studymate-ai` (Expo URL / dev client) |
| Version | `app.json:5` | `1.0.0` (`versionName`/`versionCode` base) |
| Orientation | `app.json:6` | `portrait` |
| Deep-link scheme | `app.json:8` | `studymatego://` |
| UI style | `app.json:9` | `automatic` — **follows system light/dark**; conflicts with the hard-coded dark screens (§13.4) |
| New Architecture | `app.json:10` | `newArchEnabled: true` |
| **Android package** | `app.json:15` | `com.sanjitahmed.studymateai` → `applicationId` at prebuild |
| Adaptive icon | `app.json:16-21` | background color `#E6F4FE` + `assets/images/android-icon-foreground.png` / `-background.png` / `-monochrome.png` |
| **Edge-to-edge** | `app.json:22` | `edgeToEdgeEnabled: true` → content draws under status/nav bars; this is why every screen wraps in `SafeAreaView` (`app/index.tsx:43`, `app/login.tsx:124`, `app/register.tsx:127`, `app/(tabs)/index.tsx:208`, `app/notes.tsx:221`, `app/study-planner.tsx:283/306/342`, `app/quiz.tsx:140`, `app/pdf-summary.tsx:142`, `app/ai-chat.tsx:176`) and paints its own `StatusBar` background |
| Predictive back | `app.json:23` | `predictiveBackGestureEnabled: false` → Android 13+ predictive-back animation disabled; `router.back()` (`§7.3` #14-18) still handles the gesture/button |
| Splash | `app.json:31-42` | `splash-icon.png`, width 200, `contain`, light bg `#ffffff`, **dark bg `#000000`** (`:38-40`) |
| Plugins | `app.json:29-44` | `expo-router` (`:30`), `expo-splash-screen` (`:31-42`), `expo-font` (`:43`) |
| Experiments | `app.json:45-48` | `typedRoutes: true`, `reactCompiler: true` |
| Scripts | `package.json:6-11` | `start`, `android` (`expo start --android`), `ios`, `web`, `lint`, `reset-project` |
| Android icon mapping | `components/ui/icon-symbol.tsx:16-21` | `house.fill`→`home`, `paperplane.fill`→`send` (tab bar icons on Android/web; iOS uses `components/ui/icon-symbol.ios.tsx`) |
| Tab haptics | `components/haptic-tab.tsx:10-13` | haptic fires **only** when `process.env.EXPO_OS === 'ios'` — silent on Android |
| Keyboard handling | `app/login.tsx:132-135`, `app/register.tsx:135-138`, `app/notes.tsx:224-227`, `app/study-planner.tsx:348-355`, `app/ai-chat.tsx:182-185` | `behavior="padding"` on iOS, `undefined` on Android (Android relies on `adjustResize`) |
| **Emulator networking** | `app/ai-chat.tsx:59`, `app/quiz.tsx:63`, `app/pdf-summary.tsx:99` | `http://10.0.2.2:3000/...` — the Android emulator's alias for the **host machine's** `localhost`. Explained in the comment block `app/pdf-summary.tsx:89-97` |
| Server bind | `backend/server.js:524` | `app.listen(PORT, "0.0.0.0", …)` → also reachable from a **physical device** on the same Wi-Fi via the PC's LAN IP |
| Native folders | *absent* | No `android/`, no `ios/`, no `eas.json` in git → the project uses Expo **Continuous Native Generation**: run `npx expo prebuild --platform android` to materialize `android/`, or build in the cloud with EAS. Nothing native is committed, so `app.json` is the only place Android config lives |

**Physical-device gotcha:** `10.0.2.2` only works in the emulator. On a real phone you must replace it with your computer's LAN IP (e.g. `http://192.168.1.20:3000`) in all three files listed above, and allow port 3000 through the firewall. See §13.12 for the one-line refactor that makes this a single edit.

---

<a name="8-ai-screens--backend-correlation"></a>
## 8. AI screens ↔ backend correlation

All three AI features follow the same pattern: **screen state → `fetch()` to `10.0.2.2:3000` → Express route → `@google/genai` → Gemini → response parsed back into state → re-render.**

### 8.0 Shared backend infrastructure

```
backend/server.js:1-5     express, cors, dotenv, multer, { GoogleGenAI }
backend/server.js:7       dotenv.config()          ← reads backend/.env (gitignored, .gitignore:2-4)
backend/server.js:9-10    const app = express(); const PORT = 3000;
backend/server.js:15-16   app.use(cors()); app.use(express.json());
backend/server.js:21-26   multer({ storage: memoryStorage(), limits: { fileSize: 10MB } })
backend/server.js:31-34   if (!process.env.GEMINI_API_KEY) { console.error(…); process.exit(1); }
backend/server.js:39-41   const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
backend/server.js:46      const GEMINI_MODEL = "gemini-3.6-flash"   ← single place to change model
backend/server.js:51-100  generateWithRetry(contents, maxRetries = 4)
                            ├─ ai.models.generateContent({ model, contents })   :60-63
                            ├─ retry only on 429/500/502/503/504                :76-81
                            └─ exponential backoff 2^attempt seconds            :87-95
backend/server.js:105-109 GET /  → { message: "StudyMate AI backend is running!" }   (health check)
backend/server.js:524-531 app.listen(3000, "0.0.0.0") + boot logs
```

### 8.1 AI Chat — `app/ai-chat.tsx` ↔ `POST /chat`

```
FRONTEND                                                     BACKEND
sendMessage()                       ai-chat.tsx:41
├─ trimmed = message.trim()         :42
├─ GUARD empty || loading → return  :44-46
├─ userMessage {id: Date.now(), text, sender:"user"}  :48-52
├─ setMessages(prev => [...prev, userMessage])        :54   ← user bubble appears instantly
├─ setMessage("")                   :55                    ← input cleared
├─ setLoading(true)                 :56                    ← "Thinking…" indicator :240-256
│                                                          + send-button spinner  :295-299
├─ fetch("http://10.0.2.2:3000/chat", {                  ┌─► app.post("/chat")        server.js:114
│     method: "POST",                        :60         │   ├─ destructure { message }      :116
│     headers: {"Content-Type":"application/json"}, :61-63│  ├─ empty? 400 {error}            :118-122
│     body: JSON.stringify({ message: trimmedMessage })   │   ├─ streaming headers            :127-142
│   })                                       :64-67      │   │   Content-Type text/plain :127-130
│                                                          │   │   Cache-Control no-cache :132-135
├─ responseText = await response.text()      :72  ◄───────┤   │   Connection keep-alive  :137-140
│     ← buffers the WHOLE stream before returning         │   └─ res.flushHeaders()      :142
│       (so no token-by-token typing effect — §13.13)     │
├─ console.log status + body           :74-75             │   retry loop (5 attempts)   :151-201
├─ if (!response.ok) throw new Error(responseText || …) :77-81│  ├─ generateContentStream({model, contents: message.trim()}) :157-161
├─ aiReply = responseText              :83                │   ├─ retry on 429/5xx       :177-186
├─ try JSON.parse(responseText)        :88-89             │   └─ backoff 2^attempt s    :188-199
│    ├─ parsed.reply   → aiReply       :91-92             │
│    └─ parsed.message → aiReply       :93-94             │   for await (chunk of responseStream) :211-217
├─ catch → keep plain text             :96-99             │      res.write(chunk.text)  :214-216
│     ← defensive: works with JSON *or* raw text          │   res.end()                 :219
├─ GUARD empty reply → throw           :101-103           │
├─ aiMessage {id:`${Date.now()}-ai`, text: aiReply.trim(),│   catch:                    :222-237
│            sender:"ai"}             :105-109            │    ├─ headers not sent → 503 JSON {error} :227-232
├─ setMessages(prev => [...prev, aiMessage])  :111        │    └─ already streaming → res.end()      :234-236
├─ catch → error bubble "Sorry, I couldn't connect to the │
│          AI server… port 3000"      :112-122            └─►
└─ finally setLoading(false)          :123-125
        ▼
renderMessage()  :131-170  → FlatList :227-236 → bubbles (styles :442-516)
```

### 8.2 AI Quiz — `app/quiz.tsx` ↔ `POST /generate-quiz`

```
FRONTEND                                                     BACKEND
generateQuiz()                    quiz.tsx:49
├─ GUARD !topic.trim() → Alert "Topic Required"  :50-53
├─ reset: loading=true, quiz=null, currentQuestion=0,
│         selectedAnswer=null, score=0, showResult=false     :55-60
├─ fetch("http://10.0.2.2:3000/generate-quiz", POST JSON     ┌─► app.post("/generate-quiz")   server.js:322
│    { topic, numberOfQuestions, difficulty })    :63-73     │   ├─ destructure w/ defaults 5 & "medium"  :324-328
├─ data = await response.json()                   :75  ◄─────┤   ├─ topic empty → 400 {error}             :330-334
├─ !response.ok → throw data.error                :77-79     │   ├─ clamp count to 1..20                  :336-342
├─ setQuiz(data)                                  :81        │   ├─ build prompt w/ exact JSON schema     :344-389
│      → state A→C transition; setup form hides (:166),      │   │    (topic :349, count :350, difficulty :351,
│        question view shows (:282)                          │   │     zero-based correctAnswer rules :377-383)
├─ catch → Alert "Could not connect to the AI server…" :82-87│   ├─ generateWithRetry(prompt)             :396-397  → :51-100
└─ finally setLoading(false)                      :88-90     │   ├─ strip ```json fences                  :399-415
                                                             │   ├─ JSON.parse(text)                      :419-420
                                                             │   │    └─ fail → 500 "invalid quiz format" :421-436
PLAY LOOP                                                    │   ├─ validate: questions is array          :442-450
selectAnswer(optionIndex)         quiz.tsx:97                │   ├─ validate: length === questionCount    :452-459
├─ GUARD already answered || !quiz → return   :98            │   └─ per-question validation loop          :461-505
├─ question = quiz.questions[currentQuestion] :100-101       │        question is non-empty string        :462-465
├─ setSelectedAnswer(optionIndex)             :103           │        options is array of exactly 4       :466-467
└─ if (optionIndex === question.correctAnswer)               │        correctAnswer is integer 0..3       :468-474
      setScore(prev => prev + 1)              :105-107       │        every option a non-blank string     :482-492
        ▼                                                    │        explanation, if present, a string   :495-504
   recolor: correct → green + ✓  (:326-330, :354-358)        │   res.json(quiz)                          :507
            chosen-wrong → red + ✕ (:331-335, :360-364)      │   catch → 503 {error}                     :508-518
   options locked (disabled :343)                            └─►
   explanation revealed (:371-381)
   Next button appears (:384-397)
        ▼
nextQuestion()                    quiz.tsx:114
├─ GUARD !quiz → return           :115
├─ if not last → currentQuestion+1 (:117-118), clear selection (:119)
└─ else → setShowResult(true)     :120-122   → results card :404-437
        ▼
Results: "{score} / {quiz.questions.length}"  :417-419
         accuracy % Math.round(score/length*100)  :421-425
         "Create New Quiz" → restartQuiz()  :428-435 → :129-135 (full state reset → back to setup form)
Progress bar formula: ((currentQuestion + 1) / quiz.questions.length) * 100   :303-305
Counter badge: "Question {currentQuestion + 1} of {quiz.questions.length}"    :287-289
Score badge:   "Score: {score}"                                              :293
```
The `correctAnswer` **zero-based index contract** is defined in the backend prompt (`backend/server.js:377-383`), validated in the backend (`:468-474`), and consumed in the frontend at `app/quiz.tsx:105` (scoring), `:320` (`isCorrect`), `:327`/`:354` (green + ✓). Change the contract in one place and you must change all four.

### 8.3 PDF Summary — `app/pdf-summary.tsx` ↔ `POST /summarize-pdf`

```
FRONTEND                                                     BACKEND
pickPDF()                         pdf-summary.tsx:34
├─ DocumentPicker.getDocumentAsync({type:"application/pdf",
│                                  copyToCacheDirectory:true})   :36-39
│     (import :1 — expo-document-picker, package.json:22)
├─ result.canceled → return                                   :41-43
├─ selectedFile = result.assets[0]                            :45
├─ setFile({name, uri, size, mimeType})                       :47-52
├─ setSummary("")   ← clears the previous result              :54
└─ Alert "PDF Selected"                                       :56-59
        ▼  (upload box flips to "Change Selected PDF" :192-198; file card appears :202-222)
summarizePDF()                    pdf-summary.tsx:71
├─ GUARD !file → Alert "Select PDF"                           :72-75
├─ setLoading(true) (:77) → button spinner + "Creating Summary…" :234-238
├─ formData = new FormData()                                  :81
├─ formData.append("pdf", {uri, name, type:"application/pdf"}) :83-87
│                                              ┌─► app.post("/summarize-pdf", upload.single("pdf"), …)  server.js:243-246
├─ fetch("http://10.0.2.2:3000/summarize-pdf",│    ├─ multer memory storage, 10MB cap      :21-26
│        { method:"POST", body: formData })   │    ├─ !req.file → 400 {error}              :248-252
│        :99-102   (NO Content-Type header —  │    ├─ log original filename                :254-257
│         RN sets multipart boundary itself)  │    ├─ base64PDF = req.file.buffer.toString("base64") :259-260
├─ data = await response.json()   :104  ◄─────┤    ├─ study-assistant prompt (6 sections)  :262-279
├─ !response.ok → throw data.error :106-108   │    ├─ contents = [{role:"user", parts:[
├─ setSummary(data.summary)       :110        │    │      {inlineData:{mimeType:"application/pdf", data: base64PDF}}, :286-290
│      → summary card renders :248-259        │    │      {text: prompt}]}]                 :291-293
├─ catch → Alert "Could not connect to the AI │    ├─ generateWithRetry(contents)          :298-299  → :51-100
│         server…"                :111-117    │    ├─ res.json({fileName, summary: response.text})   :301-304
└─ finally setLoading(false)      :118-120    │    └─ catch → 503 {error}                  :305-315
                                              └─►
formatFileSize(size)  :127-139  → "B" / "KB" (1 decimal) / "MB" (1 decimal); rendered :215-219
```

---

<a name="9-cross-file-correlation-matrix"></a>
## 9. Cross-file correlation matrix

### 9.1 Producer → consumer links

| # | Producer (writes/emits) | Contract | Consumer (reads/reacts) |
|---|---|---|---|
| 1 | `firebaseConfig.ts:13-15` `initializeApp` + `export const auth` | module singleton | `app/_layout.tsx:13,29` · `app/login.tsx:30,59,94` · `app/register.tsx:31,82,89,94` · `app/(tabs)/index.tsx:33,63,135` · `app/notes.tsx:5,48,68` · `app/study-planner.tsx:6,46` |
| 2 | `app/register.tsx:82-86` `createUserWithEmailAndPassword` | Firebase account (email+password) | `app/login.tsx:59-63` can now sign in |
| 3 | `app/register.tsx:89-91` `updateProfile({displayName})` | `currentUser.displayName` | `app/(tabs)/index.tsx:66-67` → `:69` `setUserName` → `:242` greeting, `:189-205`+`:255` initials |
| 4 | `app/register.tsx:82` → `userCredential.user.uid` | Firebase `uid` | `app/notes.tsx:71,50` and `app/study-planner.tsx:50` and `app/(tabs)/index.tsx:70` — becomes the storage-key suffix |
| 5 | `app/login.tsx:59-63` sign-in success | auth state change event | `app/_layout.tsx:29-35` sets `user`; `app/(tabs)/index.tsx:63-72` sets name+uid; `app/notes.tsx:48-57`; `app/study-planner.tsx:46-58` |
| 6 | `app/login.tsx:66` `router.replace("/(tabs)")` | route change | `app/(tabs)/_layout.tsx:9` TabLayout → `app/(tabs)/index.tsx:43` HomeScreen mounts |
| 7 | `app/(tabs)/index.tsx:135` `signOut(auth)` | auth state → `null` | `app/_layout.tsx:32` `setUser(null)` → guard `:53-56`; `app/notes.tsx:53-55` clears notes; `app/study-planner.tsx:51-53` clears sessions |
| 8 | `app/study-planner.tsx:121-124` `AsyncStorage.setItem("studymate_study_sessions_<uid>")` | JSON array of `StudySession` | `app/(tabs)/index.tsx:86-92` `getItem`+`JSON.parse` → `:170-184` progress → `:348,:358,:366,:370,:666,:690,:714` |
| 9 | `app/study-planner.tsx:75-77` `getStorageKey()` | exact key string | must equal `app/(tabs)/index.tsx:86` (duplicated literal, not imported) |
| 10 | `app/notes.tsx:110-113` `setItem("@studymate_notes_<uid>")` | JSON array of `Note` | `app/notes.tsx:91` `getItem` on focus/auth change → `:29` `notes` → `:211-218` → `:381-415` |
| 11 | `app/(tabs)/index.tsx:404,451,499,546,596` `router.push(...)` | route names | `app/ai-chat.tsx:23`, `app/pdf-summary.tsx:23`, `app/quiz.tsx:29`, `app/notes.tsx:26`, `app/study-planner.tsx:30` |
| 12 | `app/ai-chat.tsx:191`, `app/notes.tsx:231`, `app/pdf-summary.tsx:149`, `app/quiz.tsx:147`, `app/study-planner.tsx:361` `router.back()` | stack pop | `app/(tabs)/index.tsx:108-116` `useFocusEffect` → dashboard numbers refresh |
| 13 | `app/ai-chat.tsx:59-67` `POST /chat` | `{message}` → text/JSON stream | `backend/server.js:114-238` |
| 14 | `app/quiz.tsx:63-73` `POST /generate-quiz` | `{topic, numberOfQuestions, difficulty}` → `QuizData` | `backend/server.js:322-519` |
| 15 | `app/pdf-summary.tsx:99-102` `POST /summarize-pdf` | multipart field **`pdf`** → `{fileName, summary}` | `backend/server.js:243-317` (field name bound at `:245`) |
| 16 | `backend/server.js:39-41,46` Gemini client + model | all 3 routes | `:60-63` (`generateWithRetry`), `:157-161` (chat stream) |
| 17 | `backend/server.js:51-100` `generateWithRetry` | shared retry/backoff | `:298-299` (PDF), `:396-397` (Quiz) |
| 18 | `constants/theme.ts:11-28` `Colors.light/dark.tint` (`:15`, `:23`) | tab tint | `app/(tabs)/_layout.tsx:15` (only consumer) |
| 19 | `components/haptic-tab.tsx:5-18` `HapticTab` | custom tab button | `app/(tabs)/_layout.tsx:17` |
| 20 | `components/ui/icon-symbol.tsx:28-41` `IconSymbol` | SF-Symbol→MaterialIcons map `:16-21` | `app/(tabs)/_layout.tsx:23,30` |
| 21 | `tsconfig.json:5-9` path alias `@/*` | module resolution | `app/(tabs)/_layout.tsx:4-7`, `app/(tabs)/explore.tsx:4-10`, `app/_layout.tsx:10`, `hooks/use-theme-color.ts:6-7`, all `components/*` |
| 22 | `app.json:15` `android.package`, `:16-21` adaptive icon, `:22` edge-to-edge | prebuild/EAS input | generated `android/` (not in git) |

### 9.2 Shared-type duplications (know these before refactoring)

| Type / literal | Copy A | Copy B | Risk |
|---|---|---|---|
| `StudySession` | `app/study-planner.tsx:22-28` | `app/(tabs)/index.tsx:35-41` | field added in one place breaks the other silently |
| storage key `studymate_study_sessions_${uid}` | `app/study-planner.tsx:76` | `app/(tabs)/index.tsx:86` | typo ⇒ dashboard shows 0% forever |
| backend base URL `http://10.0.2.2:3000` | `app/ai-chat.tsx:59` | `app/quiz.tsx:63`, `app/pdf-summary.tsx:99` | device testing needs 3 edits (§13.12) |
| Poppins font map (5 weights) | `app/index.tsx:26-32` | `app/login.tsx:36-42`, `app/register.tsx:37-43`, `app/(tabs)/index.tsx:47-53` | 4 copies; 5 screens have none |
| glow-blob styles | `app/index.tsx:125-154` | `app/login.tsx:258-287`, `app/register.tsx:334-363`, `app/(tabs)/index.tsx:778-810` | visual drift between screens |

---

<a name="10-end-to-end-user-journeys"></a>
## 10. End-to-end user journeys (traced)

### Journey A — Cold start, signed out
```
1. Expo boots → package.json:3 "expo-router/entry" → app/_layout.tsx:18 RootLayout
2. loading = true (app/_layout.tsx:25) → spinner on #F7F9FC (:82-98); guard short-circuits (:42)
3. Firebase answers: onAuthStateChanged fires with null (:29-35) → setUser(null) (:32), setLoading(false) (:33)
4. Guard re-runs (:41-79): segments[0] === "index" (:44,47) → RULE 1 needs "(tabs)" (:46,53) ✗,
   RULE 2 needs a user (:63) ✗ → NO redirect → Welcome screen stays
5. app/index.tsx:22 renders; fonts gate (:26-40) → dark hero (:43-107)
6. Tap "Get Started" → app/index.tsx:96 router.push("/login")
7. app/login.tsx:32 renders the glass login card (:156-227)
```

### Journey B — First-time registration → login → dashboard
```
1. On /login tap "Register" → app/login.tsx:233 push("/register")
2. app/register.tsx:33 renders 4 fields (:161-275)
3. Type name/email/password/confirm → state :45-48
4. Tap "Create Account" → app/register.tsx:283 → handleRegister (:54)
5. Guards pass (:56-76) → setIsLoading(true) (:78) → spinner (:287-288)
6. createUserWithEmailAndPassword (:82-86) → Firebase creates the account
7. updateProfile({displayName}) (:89-91) → name stored on the Firebase user
8. signOut(auth) (:94) → root listener app/_layout.tsx:29-35 fires with null (already null-ish; user set null :32)
9. Alert (:97) → router.replace("/login") (:100) → /register removed from stack
10. User logs in: app/login.tsx:214 → handleLogin (:50) → signInWithEmailAndPassword (:59-63)
11. Alert "Login successful!" (:65) → router.replace("/(tabs)") (:66)
12. Root listener fires with the user (app/_layout.tsx:32) → guard RULE 2 not applicable (segment is "(tabs)")
13. app/(tabs)/_layout.tsx:9 mounts the tab bar → Home tab → app/(tabs)/index.tsx:43
14. Dashboard effect (:62-75) reads displayName (:66-67) → "Hello, <Name>!" (:242) + initials (:255 via :189-205)
15. useFocusEffect (:108-116) → loadStudySessions(uid) (:80-106) → AsyncStorage empty → sessions []
16. Progress block (:170-184): total 0, completed 0, remaining 0, percent 0 →
    subtitle "Start your first study session!" (:342), bar width 0% (:358), stats all 0 (:666,:690,:714)
```

### Journey C — Add a study session and watch the dashboard update
```
1. Dashboard → tap the planner banner → app/(tabs)/index.tsx:596 push("/study-planner")
2. app/study-planner.tsx:30 mounts → auth effect (:45-61) sets userId (:50), authLoading=false (:56)
3. Load effect (:67-73) → loadSessions (:79-101) → getItem (:83-84) → sessions []
4. Fill Subject/Date/Duration (:439-469) → tap "＋ Add Study Session" (:473) → addSession (:141)
5. Guards (:142-172) pass → newSession with completed:false (:174-180) → prepend (:182-185)
6. saveSessions (:187) → setItem "studymate_study_sessions_<uid>" (:121-124) → setSessions (:126)
7. Inputs cleared (:189-191) → Alert "Success" (:193-196); card appears (:502-579), count "1 session" (:493-498)
8. Progress card: completedCount 0 (:266-268) → "0 / 1" (:417), 0% (:422-424)
9. Tap ‹ back → app/study-planner.tsx:361 router.back()
10. Dashboard regains focus → useFocusEffect (app/(tabs)/index.tsx:108-116) → loadStudySessions (:80-106)
    → getItem same key (:86-87) → parse (:90) → setSessions (:92)
11. Recompute (:170-184): total 1, completed 0, remaining 1, percent 0 →
    hero "0 completed / 1 remaining" (:366,:370), stats grid 1 / 0 / 1 (:666,:690,:714)
12. Tap Done on the session (planner :547) → toggleComplete (:203-223) → flip (:212-220) → save (:222)
13. Back to dashboard → step 10-11 repeat → percent 100 (:348), bar full width (:358),
    "1 completed / 0 remaining" (:366,:370), stats 1 / 1 / 0
```

### Journey D — Notes CRUD
```
1. Dashboard → Notes card → app/(tabs)/index.tsx:546 push("/notes")
2. app/notes.tsx:26 mounts → useFocusEffect (:44-61) → initNotes (:46→:63-86)
   → auth.currentUser.uid (:68-71) → loadNotesForUser (:73→:88-102) → key "@studymate_notes_<uid>" (:90)
3. CREATE: tap + (:244-255) → editor opens (:283-327) → type → Save (:318) → saveNote (:120)
   → validations (:125-133) → new id Date.now() (:149) → prepend (:154) → setNotes (:157)
   → saveNotesToStorage (:158→:104-118) → reset (:160-163) → Alert (:165-170)
4. EDIT: tap ✏️ (:400) → editNote (:173-178) → editor pre-filled, heading "Edit Note" (:286)
   → Update (:322) → saveNote → editingNoteId truthy (:137) → map-replace (:138-146) → persist (:158)
5. DELETE: tap 🗑️ (:408) → deleteNote (:180) → confirm Alert (:181-201) → filter (:194)
   → setNotes (:196) → persist (:197)
6. SEARCH: type in the search box (:265-271) → searchText (:30) → filteredNotes (:211-218)
   → list re-renders (:381-415); counter updates (:375-378); no-match state if empty (:361-369)
7. LEAVE & RETURN: ‹ back (:231); on re-focus, useFocusEffect (:44) reloads from storage → data persists
8. SWITCH ACCOUNT: sign out (dashboard :135) → notes.tsx:53-55 clears → empty state (:336-359);
   sign in as another user → new uid → new key → that user's notes only
```

### Journey E — AI Chat round trip
```
1. Dashboard → AI Chat card → app/(tabs)/index.tsx:404 push("/ai-chat")
2. app/ai-chat.tsx:23 mounts with the seeded greeting (:30-36) rendered by renderMessage (:131-170)
3. Type in the input (:270-282) → message state (:27) → send button becomes active (:287-289)
4. Tap ↑ (:291) → sendMessage (:41) → user bubble appended (:54) → input cleared (:55)
   → loading true (:56) → "Thinking…" (:240-256)
5. fetch POST http://10.0.2.2:3000/chat (:59-67) → backend/server.js:114
6. Backend validates (:118-122), sets stream headers (:127-142), calls
   ai.models.generateContentStream (:157-161) with model "gemini-3.6-flash" (:46)
7. Chunks written to the response (:211-217), res.end() (:219)
8. Frontend response.text() (:72) resolves with the full text → ok check (:77-81)
   → JSON-or-text handling (:83-99) → non-empty check (:101-103)
9. AI bubble appended (:105-111) → loading false (:123-125) → typing indicator disappears
10. Failure path: any throw → catch (:112-122) appends the "couldn't connect… port 3000" bubble
```

### Journey F — Forgot password
```
1. On /login, type the account email into the Email field (app/login.tsx:162-171)
2. Tap "Forgot Password?" (:205) → handleForgotPassword (:87)
3. Guard: email empty → Alert "Please enter your email first." (:88-91)
4. sendPasswordResetEmail(auth, email) (:94-97) → Firebase sends the mail
5. Alert "Password reset email sent!…" (:99-101). No navigation — the user stays on /login
6. User opens the email → Firebase hosted reset page → sets a new password
7. User returns to the app and signs in with the new password (:59-63) → Journey B step 10 onwards
```

### Journey G — Sign out
```
1. Dashboard header → Sign Out button (app/(tabs)/index.tsx:265) → handleSignOut (:121)
2. Confirmation Alert (:122-152). "Cancel" (:126-129) aborts.
3. "Sign Out" (:130-133) → signOut(auth) (:135) → router.replace("/login") (:137)
4. Root listener (app/_layout.tsx:29-35) sets user null → guard RULE 1 (:53-56) would also send to /login
5. Notes/Planner in-memory state cleared (app/notes.tsx:53-55, app/study-planner.tsx:51-53);
   AsyncStorage rows untouched → next login with the same account restores everything
```

---

<a name="11-data-storage-map"></a>
## 11. Data storage map

### 11.1 AsyncStorage (device-local)

| Key template | Value shape | Written at | Read at | Owner |
|---|---|---|---|---|
| `` `@studymate_notes_${uid}` `` | `Note[]` = `{id, title, content}[]` (`app/notes.tsx:20-24`) | `app/notes.tsx:110-113` (via `:158` create/edit, `:197` delete) | `app/notes.tsx:91` (via `:52`, `:73`) | the signed-in Firebase user |
| `` `studymate_study_sessions_${uid}` `` | `StudySession[]` = `{id, subject, date, duration, completed}[]` (`app/study-planner.tsx:22-28`) | `app/study-planner.tsx:121-124` (via `:187` add, `:222` toggle, `:255` delete) | `app/study-planner.tsx:84` (via `:72`) **and** `app/(tabs)/index.tsx:87` (via `:111`) | the signed-in Firebase user |
| `` `@studymate_notes_guest_user` `` | same as notes | `app/notes.tsx:158`/`:197` when `userId` is falsy (`:121`, `:193`) | `app/notes.tsx:91` | ⚠️ shared "guest" bucket — §13.8 |

Package: `package.json:16` (`@react-native-async-storage/async-storage` `2.2.0`); imports `app/notes.tsx:1`, `app/study-planner.tsx:1`, `app/(tabs)/index.tsx:10`.

**Nothing is synced to the cloud.** Uninstalling the app, clearing app data, or switching phones loses all notes and sessions. `uid`-partitioning gives per-account isolation *on that device only*.

### 11.2 Firebase Auth (cloud)

| Field | Set at | Read at |
|---|---|---|
| email | `app/register.tsx:82-86` | `app/login.tsx:59-63` (credential) |
| password (hashed by Firebase) | `app/register.tsx:82-86` | never read |
| `displayName` | `app/register.tsx:89-91` | `app/(tabs)/index.tsx:66-67` |
| `uid` | auto-generated at `app/register.tsx:82` | `app/(tabs)/index.tsx:70`, `app/notes.tsx:50,71`, `app/study-planner.tsx:50` |

There is **no Firestore / Realtime Database / Storage** usage anywhere in the repo (`firebaseConfig.ts` imports only `firebase/app` and `firebase/auth`).

### 11.3 React state (ephemeral, per screen mount)

| Screen | State | Lines |
|---|---|---|
| `app/_layout.tsx` | `user`, `loading` | `:24-25` |
| `app/login.tsx` | `email`, `password`, `showPassword`, `isLoading` | `:44-47` |
| `app/register.tsx` | `name`, `email`, `password`, `confirmPassword`, `showPassword`, `showConfirmPassword`, `isLoading` | `:45-52` |
| `app/(tabs)/index.tsx` | `sessions`, `userName`, `userId` | `:55-57` |
| `app/notes.tsx` | `notes`, `searchText`, `showEditor`, `editingNoteId`, `title`, `content`, `loadingNotes`, `userId` | `:29-39` |
| `app/study-planner.tsx` | `subject`, `date`, `duration`, `sessions`, `userId`, `authLoading` | `:33-39` |
| `app/ai-chat.tsx` | `message`, `loading`, `messages` | `:27-36` |
| `app/quiz.tsx` | `topic`, `numberOfQuestions`, `difficulty`, `loading`, `quiz`, `currentQuestion`, `selectedAnswer`, `score`, `showResult` | `:32-43` |
| `app/pdf-summary.tsx` | `file`, `loading`, `summary` | `:26-28` |

Chat history (`app/ai-chat.tsx:30-36`) and quiz results (`app/quiz.tsx:37-43`) are **not persisted** — leaving the screen discards them.

---

<a name="12-how-to-run--locate-commands"></a>
## 12. How to run + locate commands

### 12.1 Start the AI backend (terminal 1)
```bash
cd backend
npm install                       # deps: backend/package.json:8-14
echo 'GEMINI_API_KEY=your_key_here' > .env     # REQUIRED — server exits without it (server.js:31-34)
npm start                         # → node server.js (backend/package.json:6)
# expect: "StudyMate AI backend running on port 3000" + "Gemini model: gemini-3.6-flash"  (server.js:524-531)
curl http://localhost:3000/       # health check → {"message":"StudyMate AI backend is running!"} (server.js:105-109)
```
`.env` never reaches git: `.gitignore:2-4`. There is no `.env.example` in the repo (§13.14).

### 12.2 Start the app (terminal 2)
```bash
npm install                       # root deps: package.json:13-44
npx expo start                    # or: npm start        (package.json:6)
npm run android                   # = expo start --android (package.json:8) → launches the emulator
```
Web: `npm run web` (`package.json:10`) — but `app.json:26` sets `output: "static"` and the AI calls target `10.0.2.2`, which is meaningless in a browser.

### 12.3 Backend reachability matrix

| You are running on | Use this host in `app/ai-chat.tsx:59`, `app/quiz.tsx:63`, `app/pdf-summary.tsx:99` |
|---|---|
| Android emulator | `http://10.0.2.2:3000` ✅ (already set) |
| Physical Android device (same Wi-Fi) | `http://<PC-LAN-IP>:3000` — e.g. `192.168.1.20`; server already binds `0.0.0.0` (`backend/server.js:524`); open firewall port 3000 |
| iOS simulator | `http://localhost:3000` |
| Web | `http://localhost:3000` + CORS is already open (`backend/server.js:15`) |

### 12.4 Build the Android app
```bash
npx expo prebuild --platform android   # generates ./android from app.json (nothing native is committed)
cd android && ./gradlew assembleDebug  # local APK
# — or cloud build —
npm i -g eas-cli && eas build -p android --profile preview
```
Everything Android-specific comes from `app.json:14-24` (package `:15`, adaptive icon `:16-21`, edge-to-edge `:22`, predictive back `:23`) and `app.json:29-44` (plugins).

### 12.5 Re-locate any symbol after you edit files
```bash
cd /home/user/mate

# where is a feature implemented?
grep -rn "signInWithEmailAndPassword\|createUserWithEmailAndPassword\|sendPasswordResetEmail\|signOut\|onAuthStateChanged\|updateProfile" app/ --include=*.tsx
grep -rn "AsyncStorage" app/ --include=*.tsx
grep -rn "studymate_study_sessions_\|@studymate_notes_" app/ --include=*.tsx
grep -rn "router\.\(push\|replace\|back\)" app/ --include=*.tsx
grep -rn "10.0.2.2" app/
grep -n "app.post\|app.get\|app.listen" backend/server.js

# print a file WITH line numbers (the format used throughout this doc)
cat -n app/study-planner.tsx | sed -n '100,140p'

# list every style key + its line number for a screen
awk '/^const styles = StyleSheet.create/{f=1} f && /^  [a-zA-Z]+[a-zA-Z0-9_]*: \{/{gsub(/^ +/,"",$1); print $1":"NR}' app/notes.tsx
```

---

<a name="13-gaps-bugs--inconsistencies"></a>
## 13. Gaps, bugs & inconsistencies found while mapping

Nothing here blocks the current demo flow; each item lists the exact location and the smallest fix.

| # | Severity | Finding | Location | Fix |
|---|---|---|---|---|
| 13.1 | Medium | `app/api/chat+api.ts` is a **0-byte** Expo API route. It registers `/api/chat` in the router tree but exports nothing — dead code that can break `expo export`/server rendering and confuses readers into thinking chat runs through it (it does not; chat goes to `backend/server.js:114`). | `app/api/chat+api.ts:1` (empty) | Delete the file, or implement `export async function POST(req) { … }`. |
| 13.2 | Medium (visual) | The 5 feature screens never load Poppins and contain **zero** `fontFamily` declarations, while Welcome/Login/Register/Dashboard use it. Result: two different typefaces in one app. | `app/notes.tsx`, `app/study-planner.tsx`, `app/quiz.tsx`, `app/ai-chat.tsx`, `app/pdf-summary.tsx` (no `useFonts`) vs `app/index.tsx:26-32` | Hoist `useFonts` into `app/_layout.tsx` once (with `expo-splash-screen` `preventAutoHideAsync`/`hideAsync`), delete the 4 per-screen copies, then add `fontFamily` to the feature screens' styles. |
| 13.3 | Low (visual) | Mixed icon systems: `Ionicons` on the auth+dashboard screens, raw **emoji** on all feature screens. Emoji render differently per Android version/OEM. | e.g. `app/notes.tsx:263,331,339,384,403,411,422`; `app/study-planner.tsx:290,313,389,518,574` | Swap emoji for `Ionicons`/`MaterialCommunityIcons` names. |
| 13.4 | Low | Theme conflict: `app.json:9` says `userInterfaceStyle: "automatic"` and `app/_layout.tsx:100-107` swaps `DarkTheme`/`DefaultTheme` by system setting, but every screen hard-codes dark hex colors. On a light-mode phone you get a light system/nav chrome around dark screens; the root loading screen (`app/_layout.tsx:89` `#F7F9FC`) is light too. | `app.json:9`, `app/_layout.tsx:89,100-107`, `constants/theme.ts:11-28` | Set `"userInterfaceStyle": "dark"`, force `DarkTheme` in `app/_layout.tsx:101-106`, and change `:89` to `#0B0F19`. |
| 13.5 | **High (security/UX)** | The root guard only checks `(tabs)` and `index`. `/notes`, `/ai-chat`, `/quiz`, `/pdf-summary`, `/study-planner` are **not** protected — a signed-out user who deep-links (`studymatego://notes`, `app.json:8`) or restores a stale stack lands directly on them. Planner self-protects (`app/study-planner.tsx:304-335`); Notes does not; the 3 AI screens have no Firebase import at all. | `app/_layout.tsx:44-66` | Add a protected-route list, e.g. `const protectedRoutes = ["(tabs)","notes","study-planner","ai-chat","quiz","pdf-summary"]; if (!user && protectedRoutes.includes(currentRoute)) router.replace("/login");` right after `:47`. |
| 13.6 | Low | `app/(tabs)/explore.tsx` is the untouched Expo template ("This app includes example code…"), shown as a second bottom tab next to your polished dashboard. `app/modal.tsx` is likewise a template demo. | `app/(tabs)/explore.tsx:12-112`, `app/(tabs)/_layout.tsx:26-32`, `app/modal.tsx:7-16`, `app/_layout.tsx:129-135` | Delete `explore.tsx` + its `Tabs.Screen`, `modal.tsx` + its `Stack.Screen`, and the now-unused `components/{parallax-scroll-view,collapsible,external-link,hello-wave,themed-*}`. Or repurpose Explore as a real screen. |
| 13.7 | Medium (security) | The Firebase **web API key is committed** in plain text. Web API keys are not secrets per se, but with no restrictions/App Check anyone can hammer your Auth endpoints (enumeration, quota burn). | `firebaseConfig.ts:5` | Restrict the key in Google Cloud console, enable **Firebase App Check**, and move config to `expo-constants`/`.env` + `app.json` `extra`. Also add real Firebase **Security Rules** if you ever add Firestore. |
| 13.8 | Medium | Notes fall back to a **shared** `"guest_user"` bucket: `userId` defaults to `"guest_user"` (`app/notes.tsx:39`) and `saveNote`/`deleteNote` use `userId \|\| "guest_user"` (`:121`, `:193`), while `initNotes`/the auth listener set `""` when signed out (`:54`, `:76`). So a signed-out visitor can write into `@studymate_notes_guest_user` and read whatever any previous signed-out visitor left there — contradicting the comment at `:75`. | `app/notes.tsx:39,121,193` vs `:54,76` | Either block writes when `!userId` (mirror `app/study-planner.tsx:111-117`) or delete the `"guest_user"` fallback entirely. |
| 13.9 | Low (maintainability) | `StudySession` is declared twice and the storage key string is duplicated, so the dashboard/planner contract is implicit. | `app/study-planner.tsx:22-28` + `:76` vs `app/(tabs)/index.tsx:35-41` + `:86` | Create `types/study.ts` + `lib/storageKeys.ts` exporting `studySessionsKey(uid)` / `notesKey(uid)` and import in both files. |
| 13.10 | Medium (correctness) | **"Today's Progress" is not today's.** It aggregates *all* sessions; `date` is free text and never parsed. | label `app/(tabs)/index.tsx:335-337`, math `:170-184`, input `app/study-planner.tsx:451-457` | Store an ISO date (`new Date().toISOString().slice(0,10)`) in `StudySession`, use a date picker instead of free text, then filter: `const today = new Date().toISOString().slice(0,10); const todays = sessions.filter(s => s.date === today);` and compute `:170-184` from `todays`. Keep a second "All time" block for the totals. |
| 13.11 | Low | Storage-key prefix inconsistency (`@studymate_notes_*` vs `studymate_study_sessions_*`) makes "find all app data" greps miss one family. | `app/notes.tsx:90,109` vs `app/study-planner.tsx:76` | Standardize on one prefix (see 13.9). |
| 13.12 | Medium (DX) | The backend URL `http://10.0.2.2:3000` is hard-coded in **3** places, so testing on a real device requires 3 edits and is easy to get wrong. | `app/ai-chat.tsx:59`, `app/quiz.tsx:63`, `app/pdf-summary.tsx:99` | Add `lib/config.ts`: `export const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:3000";` then `fetch(\`${API_BASE}/chat\`)`. Override per device with `EXPO_PUBLIC_API_URL=http://192.168.1.20:3000 npx expo start`. |
| 13.13 | Low (UX) | The backend **streams** the chat reply (`backend/server.js:127-142`, `:211-217`) but the client uses `await response.text()` (`app/ai-chat.tsx:72`), which waits for the stream to finish. The typewriter effect the backend was built for is lost; long answers just show "Thinking…" (`:240-256`). | `app/ai-chat.tsx:72` | Use `response.body.getReader()` + `TextDecoder` and append deltas to the last AI message as they arrive. |
| 13.14 | Low | No `backend/.env.example`, and `README.md` is still the default Expo template — it never mentions the backend, Firebase, `GEMINI_API_KEY`, or the `10.0.2.2` requirement. A new clone cannot run the AI features from the README alone. | `README.md:1-50`, `backend/` (no example env) | Add `backend/.env.example` with `GEMINI_API_KEY=` and rewrite the README with §12 of this document. |
| 13.15 | Low | Model constant `gemini-3.6-flash` is valid but superseded (`gemini-3.7-flash`, `gemini-3.8-flash`, and GA `gemini-3.5-flash` are all newer/available). Good news: it is defined in exactly one place. | `backend/server.js:46` | Change one line to the model you want; all 3 routes inherit it (`:60-63`, `:157-161`). |
| 13.16 | Low | `alert()` (web-style) is used on the auth screens (`app/login.tsx:52,65,71,73,75,77,79,89,100,106,108,110`; `app/register.tsx:62,68,74,97,105,107,109,111`) while Notes/Planner use the native `Alert.alert` (`app/notes.tsx:100,116,126,131,165,181`; `app/study-planner.tsx:112,130,143,151,159,167,193,205,231,238`). `alert()` renders inconsistently on Android. | as listed | Replace `alert(...)` with `Alert.alert("…", "…")`. |
| 13.17 | Low | Notes' `useFocusEffect` callback has an empty dependency array (`app/notes.tsx:60`) while calling `initNotes`/`loadNotesForUser` defined in the component body — it works because those functions close over nothing that changes, but it trips the `react-hooks/exhaustive-deps` lint rule (`eslint.config.js`) and is fragile. Compare the correct pattern at `app/(tabs)/index.tsx:108-116` (deps `[userId, loadStudySessions]`). | `app/notes.tsx:44-61` | Wrap `initNotes`/`loadNotesForUser` in `useCallback` and list them in the deps array. |
| 13.18 | Low | `loadingNotes` is only ever set to `false` inside `initNotes` (`app/notes.tsx:84`); the `onAuthStateChanged` branch (`:48-57`) can update `notes` afterwards without touching the flag. Harmless today, but a future refactor that sets `loadingNotes = true` elsewhere could hang the ⏳ state (`:329-333`). | `app/notes.tsx:38,48-57,65,84` | Manage the flag in one place (a single `loadNotes(uid)` helper). |
| 13.19 | Info | Planner date/duration are free-text `TextInput`s (`app/study-planner.tsx:451-457`, `:463-469`) — no validation, no `DateTimePicker`, no minutes-to-number conversion. This is what makes 13.10 hard. | as listed | Add `@react-native-community/datetimepicker` and store `dateISO` + `durationMinutes`. |
| 13.20 | Info | No tests, no CI workflow, and `npm run lint` (`package.json:11`) is the only quality gate. | repo root | Add `__tests__/` with Jest + `@testing-library/react-native`, and a GitHub Action running `lint` + `tsc --noEmit`. |

---

<a name="14-i-want-to-change-x--quick-reference"></a>
## 14. "I want to change X" → quick reference

| I want to change… | Edit exactly here |
|---|---|
| App name / launcher icon / splash | `app.json:3`, `:7`, `:31-42`; assets in `assets/images/` |
| Android package name | `app.json:15` (then `npx expo prebuild --clean`) |
| The dark background color of a screen | Welcome `app/index.tsx:121` · Login `app/login.tsx:254` · Register `app/register.tsx:330` · Dashboard `app/(tabs)/index.tsx:773` · Notes `app/notes.tsx:440` · Planner `app/study-planner.tsx:609` · Quiz `app/quiz.tsx:445` · PDF `app/pdf-summary.tsx:274` · Chat `app/ai-chat.tsx:323` |
| Primary button color (blue) | `app/index.tsx:250`, `app/login.tsx:398`, `app/register.tsx:461-474` |
| Glow blobs (size/color/opacity) | `app/index.tsx:125-154`, `app/login.tsx:258-287`, `app/register.tsx:334-363`, `app/(tabs)/index.tsx:778-810` |
| Firebase project / credentials | `firebaseConfig.ts:4-11` |
| Which routes require login | `app/_layout.tsx:44-66` (see §13.5 for the patch) |
| The "Student" fallback name | `app/(tabs)/index.tsx:56` and `:67` |
| Greeting text / hero copy | `app/(tabs)/index.tsx:229-247`, `:308-319` |
| Dashboard feature cards (add/remove/reorder) | `app/(tabs)/index.tsx:400-588` + icon-box styles `:1135-1150` |
| Daily AI tip text | `app/(tabs)/index.tsx:748-755` |
| Progress math (dashboard) | `app/(tabs)/index.tsx:170-184` |
| Progress math (planner) | `app/study-planner.tsx:266-275` |
| Notes storage key / shape | `app/notes.tsx:20-24` (type), `:90` + `:109` (keys) |
| Note validation messages | `app/notes.tsx:125-133` |
| Session storage key / shape | `app/study-planner.tsx:22-28` (type), `:75-77` (key) **and** `app/(tabs)/index.tsx:35-41`, `:86` |
| Planner field validation | `app/study-planner.tsx:142-172` |
| Backend port | `backend/server.js:10` (+ the 3 client URLs, §13.12) |
| Gemini model | `backend/server.js:46` |
| Retry policy / backoff | `backend/server.js:51-100` (non-stream), `:151-201` (chat stream) |
| PDF size limit | `backend/server.js:23-25` (10 MB) |
| PDF summary structure (the 6 sections) | `backend/server.js:262-279` |
| Quiz JSON contract | prompt `backend/server.js:344-389`, validation `:442-505`, client types `app/quiz.tsx:16-27` |
| Max questions allowed | chips `app/quiz.tsx:196` (`[5,10,15]`) + clamp `backend/server.js:336-342` (1..20) |
| Chat seed greeting | `app/ai-chat.tsx:30-36` |
| Chat error bubble text | `app/ai-chat.tsx:117-119` |
| Tab bar (add a 3rd tab, change tint/icons) | `app/(tabs)/_layout.tsx:13-33`, tint source `constants/theme.ts:15,23`, icon map `components/ui/icon-symbol.tsx:16-21` |

---

### One-paragraph summary of how the whole thing works

`firebaseConfig.ts:15` creates a single Firebase `auth` object that six screens import. `app/_layout.tsx` subscribes to it once (`:29-35`) and turns the result into two pieces of state (`user`, `loading`); a second effect (`:41-79`) is the **route guard** that pushes signed-out users off `/(tabs)` to `/login` (`:53-56`) and skips the Welcome screen for signed-in users (`:63-66`), while deliberately leaving Login/Register to navigate themselves (`:68-78`). Registration (`app/register.tsx:54-116`) creates the account (`:82-86`), writes the **displayName** (`:89-91`), signs out (`:94`) and sends the user to Login (`:100`); Login (`app/login.tsx:50-84`) signs in (`:59-63`) and replaces the stack with `/(tabs)` (`:66`); Forgot Password (`app/login.tsx:87-113`) calls `sendPasswordResetEmail` (`:94-97`); Sign Out (`app/(tabs)/index.tsx:121-153`) confirms then calls `signOut` (`:135`) and returns to `/login` (`:137`). The **uid** from that auth object is then interpolated into AsyncStorage keys — `@studymate_notes_<uid>` (`app/notes.tsx:90,109`) and `studymate_study_sessions_<uid>` (`app/study-planner.tsx:76`, mirrored at `app/(tabs)/index.tsx:86`) — which is the entire mechanism behind "user-specific notes" and "user-specific planner data". Notes CRUD is one screen (`app/notes.tsx:120-209`) with a single writer (`:104-118`); Planner add/complete/delete is one screen (`app/study-planner.tsx:141-260`) with a single writer (`:107-135`), and the dashboard re-reads that same key on every focus (`app/(tabs)/index.tsx:108-116`) to render Today's Progress (`:170-184` → `:332-373`) and the stats grid (`:649-721`). The dashboard's five cards (`:404, :451, :499, :546, :596`) push the feature screens, whose `‹` buttons (`app/ai-chat.tsx:191`, `app/notes.tsx:231`, `app/pdf-summary.tsx:149`, `app/quiz.tsx:147`, `app/study-planner.tsx:361`) pop back. The three AI screens talk to an Express server on port 3000 (`backend/server.js:524`) — `/chat` streaming (`:114-238`), `/summarize-pdf` with multer + base64 inline data (`:243-317`), `/generate-quiz` with a strict JSON contract and full validation (`:322-519`) — all through one Gemini client (`:39-46`) and one retry helper (`:51-100`). Android specifics live entirely in `app.json` (package `:15`, adaptive icon `:16-21`, edge-to-edge `:22`, plugins `:29-44`), with `10.0.2.2` as the emulator's alias for the host backend.
