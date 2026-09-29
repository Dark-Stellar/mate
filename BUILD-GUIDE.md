# StudyMate AI — Build From Scratch Guide

A complete, step-by-step guide to rebuilding this app from zero.
The finished app lives in this same repo — after each step, compare your result
with the file mentioned in **"Verify against:"**.

```
┌─────────────────────────────┐        ┌──────────────────────────────┐
│  ANDROID APP (Expo)         │  HTTP  │  NODE.JS BACKEND (port 3000) │
│                             │ ─────► │                              │
│  Firebase Auth ── identity  │  10.0. │  Express + multer + cors     │
│  AsyncStorage  ── notes,    │  2.2   │        │                     │
│                planner      │        │        ▼                     │
│  Screens: welcome, login,   │ ◄───── │  GEMINI (chat, PDF, quiz)    │
│  register, home, ai-chat,   │  JSON  │                              │
│  notes, quiz, planner, pdf  │        │                              │
└─────────────────────────────┘        └──────────────────────────────┘
```

**Tech stack**
| Part | Technology |
|---|---|
| Mobile app | Expo (React Native) + TypeScript + Expo Router (file-based routing) |
| Auth | Firebase Authentication (email/password) — config only, no Firestore |
| Local data | AsyncStorage, keyed by Firebase UID |
| PDF picking | expo-document-picker |
| Backend | Node.js + Express 5 + multer (file upload) + dotenv |
| AI | `@google/genai` SDK → Gemini (chat streaming, PDF multimodal, quiz JSON) |
| Styling | Per-screen `StyleSheet`, dark theme, Poppins fonts, glassmorphism |

**Build order (why this order):**
1. Scaffold → 2. Firebase → 3. Login/Register → 4. Root layout + auth guard →
5. Welcome → 6. Home dashboard → 7. Notes → 8. Planner → 9. **Backend** →
10. AI Chat → 11. PDF → 12. Quiz → 13. Polish → 14. Test on emulator.

You build the "offline" features first (they need no backend), then the backend,
then the three AI screens that depend on it.

---

## Phase 0 — Prerequisites

Check each box before starting:

- [ ] **Node.js LTS** installed (`node -v` works)
- [ ] **Android Studio** installed with an **emulator** running (any API level works),
      or a physical Android phone
- [ ] A **Google account** → free Gemini API key from
      https://aistudio.google.com → "Get API key" → copy it
- [ ] A **Firebase account** (free tier is enough)
- [ ] Git (optional but recommended)

---

## Phase 1 — Scaffold the Expo app

```bash
# 1. Create the project (default template = TypeScript + tabs example)
npx create-expo-app@latest studymate-ai

# 2. Go inside
cd studymate-ai

# 3. Install the extra packages we need
npm install firebase @expo-google-fonts/poppins
npx expo install @react-native-async-storage/async-storage expo-document-picker

# 4. Sanity check — start the app and open the emulator
npx expo start        # then press "a"
```

> `npx expo install` is used for `expo-*` packages so versions match your Expo SDK.
> `npm install` is for normal packages (firebase, fonts).

The default template gives you `app/(tabs)/index.tsx`, `app/(tabs)/explore.tsx`,
`app/(tabs)/_layout.tsx`, `app/modal.tsx` — we'll repurpose/replace them.

**Verify against:** repo `package.json` (firebase, async-storage, document-picker,
poppins present) and `app.json` (app name, android package).

---

## Phase 2 — Firebase project + config

1. Go to **https://console.firebase.google.com** → *Add project* → name it
   `studymate-ai` → finish.
2. In the project: **Build → Authentication → Get started → Sign-in method →
   Email/Password → Enable**.
3. **Project settings (⚙) → Your apps → Add app → Web app** (</>) → register →
   copy the `firebaseConfig` object it shows you (apiKey, authDomain, projectId, …).
4. Create **`firebaseConfig.ts`** in the project root:

```ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  // PASTE YOUR PROJECT'S CONFIG HERE
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
```

We only ever import `auth` — this app uses **Firebase Authentication only**
(no Firestore, no Storage). All AI work goes through our own Node backend.

**Verify against:** `firebaseConfig.ts`.

---

## Phase 3 — Register & Login screens

Create `app/register.tsx` and `app/login.tsx`. These are plain React Native
screens (SafeAreaView + ScrollView + TextInput + TouchableOpacity).

### 3.1 Register — `app/register.tsx` (core logic)

```tsx
import { createUserWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StatusBar,
         Text, TextInput, TouchableOpacity, View, StyleSheet } from "react-native";
import { auth } from "../firebaseConfig";

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    // 1) Client-side validation
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert("Please fill in all fields."); return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Passwords do not match."); return;
    }
    if (password.length < 6) {
      Alert.alert("Password must be at least 6 characters."); return;
    }

    setIsLoading(true);
    try {
      // 2) Create the Firebase account
      const userCredential = await createUserWithEmailAndPassword(
        auth, email.trim(), password
      );
      // 3) Save display name on the Firebase profile  ← "user display name"
      await updateProfile(userCredential.user, { displayName: name.trim() });
      // 4) Sign out so the user must log in manually
      await signOut(auth);
      // 5) Success → go to Login
      Alert.alert("Account created successfully! Please login to continue.");
      router.replace("/login");
    } catch (error: any) {
      // 6) Map Firebase error codes to friendly messages
      if (error.code === "auth/email-already-in-use") Alert.alert("This email is already registered.");
      else if (error.code === "auth/weak-password")   Alert.alert("Password must be at least 6 characters.");
      else if (error.code === "auth/invalid-email")   Alert.alert("Please enter a valid email address.");
      else Alert.alert("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />
      <ScrollView>
        {/* Full Name / Email / Password / Confirm inputs — each is:
            label Text + View wrapper + icon + TextInput */}
        <TextInput value={name}  onChangeText={setName}   placeholder="Enter your full name" />
        <TextInput value={email} onChangeText={setEmail}  placeholder="Enter your email"
                   keyboardType="email-address" autoCapitalize="none" />
        <TextInput value={password} onChangeText={setPassword}
                   placeholder="Create a password" secureTextEntry />
        <TextInput value={confirmPassword} onChangeText={setConfirmPassword}
                   placeholder="Confirm password" secureTextEntry />
        <TouchableOpacity onPress={handleRegister} disabled={isLoading}>
          {isLoading ? <ActivityIndicator /> : <Text>Create Account</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/login")}>
          <Text>Already have an account? Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0F19" },
  // ... add your dark glassmorphism styles (see Phase 13)
});
```

Key ideas to understand:
- **State** (`useState`) holds the form values; `onChangeText` updates them.
- `signInWithEmailAndPassword`/`createUserWithEmailAndPassword` do the actual
  auth against Firebase — the app never stores passwords.
- `displayName` is saved on the Firebase **user profile** and is what the home
  screen shows later.

### 3.2 Login — `app/login.tsx` (core logic)

```tsx
import { sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) { Alert.alert("Please enter email and password."); return; }
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      Alert.alert("Login successful!");
      router.replace("/(tabs)");            // ← enter the protected dashboard
    } catch (error: any) {
      if (error.code === "auth/user-not-found")     Alert.alert("No account found with this email.");
      else if (error.code === "auth/wrong-password") Alert.alert("Incorrect password.");
      else if (error.code === "auth/invalid-email")  Alert.alert("Please enter a valid email address.");
      else if (error.code === "auth/invalid-credential") Alert.alert("Invalid email or password.");
      else Alert.alert("Login failed. Please try again.");
    } finally { setIsLoading(false); }
  };

  const handleForgotPassword = async () => {   // ← "Forgot Password" feature
    if (!email.trim()) { Alert.alert("Please enter your email first."); return; }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert("Password reset email sent! Check your inbox.");
    } catch (error: any) {
      if (error.code === "auth/user-not-found") Alert.alert("No account found with this email.");
      else Alert.alert("Could not send password reset email.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* email + password inputs, Forgot Password? link (onPress={handleForgotPassword}),
          Login button (onPress={handleLogin}), "Don't have an account? Register"
          → router.push("/register") */}
    </SafeAreaView>
  );
}
```

Now test: `npx expo start`, open the emulator, type `/login` in the router
search — register a user, log in. (The layout guard in the next phase will
redirection you around; that's normal until Phase 4.)

**Verify against:** `app/register.tsx`, `app/login.tsx` (register flow order:
create → updateProfile → signOut → login).

---

## Phase 4 — Root layout + authentication guard

Replace **`app/_layout.tsx`**. This is the single most important "structure"
file: it wraps every screen in the theme + navigation `Stack`, shows a loading
splash while Firebase decides who's logged in, and **protects the dashboard**.

```tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 1) Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // 2) Route guard — runs on every navigation
  useEffect(() => {
    if (loading) return;
    const currentRoute = segments[0];
    const inTabs  = currentRoute === "(tabs)";
    const inIndex = currentRoute === "index";

    if (!user && inTabs) router.replace("/login");   // not logged in → can't be in Home
    if (user && inIndex) router.replace("/(tabs)");  // logged in → skip welcome
    // NOTE: do NOT auto-redirect login/register here — those screens
    // navigate themselves after a successful action.
  }, [user, loading, segments]);

  // 3) Loading splash while auth state resolves
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center",
                     backgroundColor: "#F7F9FC" }}>
        <ActivityIndicator size="large" color="#4F6EF7" />
      </View>
    );
  }

  // 4) The screen stack (every file in app/ becomes a route)
  return (
    <ThemeProvider value={useColorScheme() === "dark" ? DarkTheme : DefaultTheme}>
      <Stack initialRouteName="index">
        <Stack.Screen name="index"    options={{ headerShown: false }} />
        <Stack.Screen name="login"    options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)"   options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
```

**How the protection works (memorize this for the viva):**
`onAuthStateChanged` tells us *who* the user is; `useSegments()` tells us
*where* we are. Two rules:
- **not logged in** and trying to be in `(tabs)` → `router.replace("/login")`
- **logged in** and sitting on the welcome screen → `router.replace("/(tabs)")`

**Verify against:** `app/_layout.tsx` (its comments explain the same rules).

---

## Phase 5 — Welcome screen (app entry point)

Replace **`app/index.tsx`** with a `WelcomeScreen`:
- Dark background `#0B0F19`
- Three absolute-positioned "glow" circles (purple/pink/blue, `opacity ~0.2`)
- Logo circle with `Ionicons name="school-outline"`
- Title "StudyMate AI", subtitle, description
- Three glass feature cards (AI Chat / PDF Summary / AI Quiz) — purely decorative
- **Get Started button → `router.push("/login")`**

Font loading pattern (used on EVERY screen of the app):

```tsx
import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold,
         Poppins_700Bold, Poppins_800ExtraBold, useFonts } from "@expo-google-fonts/poppins";

const [fontsLoaded] = useFonts({
  Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold,
  Poppins_700Bold, Poppins_800ExtraBold,
});
if (!fontsLoaded) return <ActivityIndicator size="large" />;
// then use fontFamily: "Poppins_700Bold" etc. in styles
```

**Verify against:** `app/index.tsx`.

---

## Phase 6 — Home Dashboard (the protected tab)

The tab layout `app/(tabs)/_layout.tsx` comes with the template (Tabs: Home +
Explore). Keep it; rename icons if you like. Now replace **`app/(tabs)/index.tsx`**
with the Home screen. Build it in 5 blocks:

### 6.1 Get the current user (name + uid)

```tsx
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";

const [userName, setUserName] = useState("Student");
const [userId, setUserId] = useState<string | null>(null);

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
    setUserName(currentUser?.displayName?.trim() || "Student");
    setUserId(currentUser?.uid || null);
  });
  return unsubscribe;
}, []);
```

### 6.2 Load planner data (shared key with the Planner screen)

```tsx
type StudySession = { id: string; subject: string; date: string;
                      duration: string; completed: boolean };

const loadStudySessions = useCallback(async (uid: string | null) => {
  if (!uid) { setSessions([]); return; }
  const storageKey = `studymate_study_sessions_${uid}`;   // ← SAME key as planner
  const saved = await AsyncStorage.getItem(storageKey);
  if (saved) setSessions(JSON.parse(saved).length ? JSON.parse(saved) : []);
  else setSessions([]);
}, []);

useFocusEffect(useCallback(() => {
  if (userId) loadStudySessions(userId); else setSessions([]);
}, [userId, loadStudySessions]));
```

`useFocusEffect` = "re-run whenever this screen is focused" — that's how the
dashboard stays in sync with the planner.

### 6.3 Sign out

```tsx
const handleSignOut = () => {
  Alert.alert("Sign Out", "Are you sure?", [
    { text: "Cancel", style: "cancel" },
    { text: "Sign Out", style: "destructive",
      onPress: async () => { await signOut(auth); router.replace("/login"); } },
  ]);
};
```

### 6.4 Progress calculations ("Today's Progress")

```tsx
const totalSessions     = sessions.length;
const completedSessions = sessions.filter(s => s.completed).length;
const remainingSessions = totalSessions - completedSessions;
const progressPercent   = totalSessions > 0
  ? Math.round((completedSessions / totalSessions) * 100) : 0;
```

Render as: title text → percent circle → progress bar (`<View style={{width:
`${progressPercent}%`}} />` inside a fixed-height track) → "X completed /
Y remaining" footer. Plus the 3 stat cards (Total/Completed/Remaining).

### 6.5 Feature grid (navigation to everything else)

Four `TouchableOpacity` cards + one banner, each just does `router.push(...)`:

| Card | Destination |
|---|---|
| AI Chat | `router.push("/ai-chat")` |
| PDF Summary | `router.push("/pdf-summary")` |
| AI Quiz | `router.push("/quiz")` |
| My Notes | `router.push("/notes")` |
| Study Planner banner | `router.push("/study-planner")` |

Also add: "Hello, {userName}!" greeting, initials avatar (split name, take
first letters of first+last word), Sign Out button (top-right, red).

**Verify against:** `app/(tabs)/index.tsx`.

---

## Phase 7 — Notes (CRUD + per-user local storage)

Create **`app/notes.tsx`**. No backend — everything is AsyncStorage.

### 7.1 The storage pattern (the heart of "user-specific notes")

```tsx
type Note = { id: string; title: string; content: string };
const [notes, setNotes] = useState<Note[]>([]);

// uid comes from auth.currentUser.uid (watch onAuthStateChanged to refresh it)
const storageKeyFor = (uid: string) => `@studymate_notes_${uid}`;

const loadNotesForUser = async (uid: string) => {
  const saved = await AsyncStorage.getItem(storageKeyFor(uid));
  setNotes(saved ? JSON.parse(saved) : []);
};

const saveNotesToStorage = async (updated: Note[], uid: string) => {
  await AsyncStorage.setItem(storageKeyFor(uid), JSON.stringify(updated));
};
```

Every account gets its own key (`@studymate_notes_<uid>`), so accounts never
see each other's notes on the same device.

### 7.2 CRUD functions

```tsx
// CREATE + UPDATE (same function; editingNoteId decides which)
const saveNote = async () => {
  if (!title.trim() || !content.trim()) { Alert.alert("Fill both fields."); return; }
  let updated: Note[];
  if (editingNoteId) {
    updated = notes.map(n => n.id === editingNoteId
      ? { ...n, title: title.trim(), content: content.trim() } : n);
  } else {
    updated = [{ id: Date.now().toString(),
                 title: title.trim(), content: content.trim() }, ...notes];
  }
  setNotes(updated);
  await saveNotesToStorage(updated, userId);
  // clear form, close editor, success alert
};

// EDIT = fill the editor with the note's values
const editNote = (note: Note) => {
  setTitle(note.title); setContent(note.content);
  setEditingNoteId(note.id); setShowEditor(true);
};

// DELETE = confirm, then filter out
const deleteNote = (id: string) => {
  Alert.alert("Delete Note", "Are you sure?", [
    { text: "Cancel", style: "cancel" },
    { text: "Delete", style: "destructive",
      onPress: async () => {
        const updated = notes.filter(n => n.id !== id);
        setNotes(updated);
        await saveNotesToStorage(updated, userId);
      } },
  ]);
};
```

### 7.3 UI pieces

- Search bar: `searchText` state + `notes.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q))`
- Note cards in a map: icon + title (`numberOfLines={1}`) + 3-line preview + ✏️/🗑️ buttons
- Inline editor card (title input + multiline content input + Cancel/Save)
- Empty state ("No Notes Yet" + Create button)
- `useFocusEffect` → reload notes every time the screen is focused

**Verify against:** `app/notes.tsx`.

---

## Phase 8 — Study Planner

Create **`app/study-planner.tsx`**. Same AsyncStorage pattern as notes, with
key `studymate_study_sessions_${uid}` (the one the Home screen reads).

```tsx
type StudySession = { id: string; subject: string; date: string;
                      duration: string; completed: boolean };

const getStorageKey = (uid: string) => `studymate_study_sessions_${uid}`;

// CREATE
const addSession = async () => {
  if (!userId) { Alert.alert("Login Required", "Please login first."); return; }
  if (!subject.trim() || !date.trim() || !duration.trim()) {
    Alert.alert("Missing fields"); return;
  }
  const newSession: StudySession = {
    id: Date.now().toString(),
    subject: subject.trim(), date: date.trim(),
    duration: duration.trim(), completed: false,
  };
  const updated = [newSession, ...sessions];
  await saveSessions(updated);
};

// COMPLETE / UNDO
const toggleComplete = async (id: string) => {
  const updated = sessions.map(s =>
    s.id === id ? { ...s, completed: !s.completed } : s);
  await saveSessions(updated);
};

// DELETE
const deleteSession = (id: string) => {
  Alert.alert("Delete Session", "Are you sure?", [
    { text: "Cancel", style: "cancel" },
    { text: "Delete", style: "destructive",
      onPress: async () => {
        await saveSessions(sessions.filter(s => s.id !== id));
      } },
  ]);
};

// PROGRESS
const completedCount = sessions.filter(s => s.completed).length;
const progressPercentage = sessions.length
  ? Math.round((completedCount / sessions.length) * 100) : 0;
```

UI pieces:
- **Auth fallback:** if `!userId`, render a lock screen with a "Go to Login"
  button instead of the planner (second line of defense after the root guard).
- Intro card, purple progress card (`completedCount / sessions.length` + %),
  Add-Session form (Subject / Date / Duration text inputs), FlatList of session
  cards (📚 pending / ✅ done, line-through when done, Done/Undo + 🗑️ buttons),
  empty state.

Test now: add a session, mark it done, go back to Home → the dashboard progress
bar and stats should have updated. **That moment proves the two screens share
one data source.**

**Verify against:** `app/study-planner.tsx`.

---

## Phase 9 — The Node.js + Express + Gemini backend

Everything AI-related goes through ONE server so the Gemini API key never lives
inside the app.

```bash
mkdir backend && cd backend
npm init -y
npm install express cors dotenv multer @google/genai
```

Create **`backend/.env`** (create it by hand or via editor — it's secret):

```
GEMINI_API_KEY=YOUR_KEY_FROM_AI_STUDIO
```

And in the repo root's `.gitignore`, make sure `.env` is ignored:

```
.env
.env.*
```

Create **`backend/server.js`**:

```js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const { GoogleGenAI } = require("@google/genai");

dotenv.config();
const app = express();
const PORT = 3000;

// ---- Middleware -------------------------------------------------------
app.use(cors());          // allow requests from the Android app
app.use(express.json());  // parse JSON bodies

// ---- PDF upload (in-memory, max 10 MB) -------------------------------
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ---- Gemini setup ------------------------------------------------------
if (!process.env.GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is missing.");
  process.exit(1);                       // fail fast at startup
}
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Model constant — use a model your API key can access
// (the finished repo uses "gemini-3.6-flash")
const GEMINI_MODEL = "gemini-3.6-flash";

// ---- Retry helper (used by PDF + quiz) --------------------------------
async function generateWithRetry(contents, maxRetries = 4) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await ai.models.generateContent({ model: GEMINI_MODEL, contents });
    } catch (error) {
      lastError = error;
      const status = error?.status || error?.code;
      const shouldRetry = [429, 500, 502, 503, 504].includes(status);
      if (!shouldRetry || attempt === maxRetries) throw error;
      const delay = Math.pow(2, attempt) * 1000;   // 1s, 2s, 4s, 8s
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastError;
}

// ---- 1) Health check ----------------------------------------------------
app.get("/", (req, res) => {
  res.json({ message: "StudyMate AI backend is running!" });
});

// ---- 2) AI CHAT (streaming) ---------------------------------------------
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim())
      return res.status(400).json({ error: "Message is required." });

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    // Retry loop BEFORE streaming starts (5 attempts, backoff on 429/5xx)
    let responseStream;
    for (let attempt = 0; attempt <= 4; attempt++) {
      try {
        responseStream = await ai.models.generateContentStream({
          model: GEMINI_MODEL,
          contents: message.trim(),
        });
        break;
      } catch (error) {
        const status = error?.status || error?.code;
        if (![429,500,502,503,504].includes(status) || attempt === 4) throw error;
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
      }
    }

    // Pipe Gemini chunks straight to the app
    for await (const chunk of responseStream) {
      if (chunk.text) res.write(chunk.text);
    }
    res.end();
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    if (!res.headersSent)
      return res.status(503).json({
        error: "Gemini AI is temporarily unavailable. Please try again in a few seconds."
      });
    res.end(); // stream already started — just close it
  }
});

// ---- 3) PDF SUMMARY ------------------------------------------------------
app.post("/summarize-pdf", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: "PDF file is required." });

    const base64PDF = req.file.buffer.toString("base64");

    const prompt = `
You are StudyMate AI, an academic study assistant.
Read the uploaded PDF carefully and create a clear, student-friendly summary.
Provide: 1. Main Topic  2. Key Points  3. Important Definitions
4. Important Concepts  5. Short Summary  6. Exam/Study Notes
Use simple English, clear headings and bullet points.
Do not include information that is not present in the PDF.`;

    // Send the PDF to Gemini as multimodal (base64 inline data) + prompt
    const contents = [{
      role: "user",
      parts: [
        { inlineData: { mimeType: "application/pdf", data: base64PDF } },
        { text: prompt },
      ],
    }];

    const response = await generateWithRetry(contents);
    res.json({ fileName: req.file.originalname, summary: response.text });
  } catch (error) {
    console.error("PDF Summary Error:", error);
    res.status(503).json({
      error: "Gemini AI is temporarily unavailable. Please try the PDF again in a few seconds."
    });
  }
});

// ---- 4) AI QUIZ (strict-JSON generation + validation) --------------------
app.post("/generate-quiz", async (req, res) => {
  try {
    const { topic, numberOfQuestions = 5, difficulty = "medium" } = req.body;
    if (!topic || !topic.trim())
      return res.status(400).json({ error: "Topic is required." });

    const questionCount = Math.max(1, Math.min(Number(numberOfQuestions) || 5, 20));

    const prompt = `
You are StudyMate AI, an academic quiz generator.
Create a multiple-choice quiz for students.
Topic: ${topic}
Number of Questions: ${questionCount}
Difficulty: ${difficulty}

Return ONLY valid JSON in exactly this format:
{
  "topic": "${topic}",
  "difficulty": "${difficulty}",
  "questions": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Short explanation"
    }
  ]
}
RULES:
1. Exactly ${questionCount} questions.
2. Every question has exactly 4 options.
3. "correctAnswer" is a NUMBER = zero-based index of the correct option (A=0…D=3).
4. Only one option can be correct.
5. Simple English. No markdown. Valid JSON only.`;

    const response = await generateWithRetry(prompt);
    let text = response.text.trim()
      .replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");

    let quiz;
    try { quiz = JSON.parse(text); }
    catch {
      return res.status(500).json({
        error: "Gemini returned an invalid quiz format. Please try again."
      });
    }

    // Validate BEFORE trusting it (the repo's full validation is in
    // backend/server.js lines ~430-480):
    if (!quiz?.questions || !Array.isArray(quiz.questions)
        || quiz.questions.length !== questionCount)
      throw new Error("Invalid quiz format.");
    for (const q of quiz.questions) {
      if (!q.question || !Array.isArray(q.options) || q.options.length !== 4
          || typeof q.correctAnswer !== "number"
          || !Number.isInteger(q.correctAnswer)
          || q.correctAnswer < 0 || q.correctAnswer > 3
          || !q.options.every(o => typeof o === "string" && o.trim()))
        throw new Error("Invalid question format.");
    }

    res.json(quiz);
  } catch (error) {
    console.error("Quiz Generation Error:", error);
    res.status(503).json({
      error: "Gemini AI is temporarily unavailable. Please try generating the quiz again."
    });
  }
});

// ---- Start ----------------------------------------------------------------
app.listen(PORT, "0.0.0.0", () => {
  console.log(`StudyMate AI backend running on port ${PORT}`);
  console.log(`Gemini model: ${GEMINI_MODEL}`);
});
```

**Run and test the backend** (in `backend/`):

```bash
npm start
```

```bash
# health check
curl http://localhost:3000/

# chat
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Explain Newton's first law simply"}'

# quiz
curl -X POST http://localhost:3000/generate-quiz \
  -H "Content-Type: application/json" \
  -d '{"topic":"Photosynthesis","numberOfQuestions":5,"difficulty":"easy"}'

# pdf (save a sample.pdf first)
curl -X POST http://localhost:3000/summarize-pdf -F "pdf=@sample.pdf"
```

If all four return sensible output, your backend is done.

**Verify against:** `backend/server.js` + `backend/package.json`.

---

## Phase 10 — AI Chat screen

Create **`app/ai-chat.tsx`**. The UI is a `FlatList` of message bubbles + an
input bar; the logic is one function:

```tsx
type Message = { id: string; text: string; sender: "user" | "ai" };

const [messages, setMessages] = useState<Message[]>([
  { id: "1", text: "Hello! 👋 I'm your AI study assistant. How can I help you today?",
    sender: "ai" },
]);
const [message, setMessage] = useState("");
const [loading, setLoading] = useState(false);

const sendMessage = async () => {
  const trimmed = message.trim();
  if (!trimmed || loading) return;

  setMessages(prev => [...prev, { id: Date.now().toString(), text: trimmed, sender: "user" }]);
  setMessage("");
  setLoading(true);

  try {
    // Android EMULATOR: 10.0.2.2 = your PC's localhost
    // (physical device → use your PC's LAN IP instead)
    const response = await fetch("http://10.0.2.2:3000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: trimmed }),
    });

    // Read as text first — works whether the server streams plain text
    // or returns JSON
    const responseText = await response.text();
    if (!response.ok) throw new Error(responseText || `Server error: ${response.status}`);

    let aiReply = responseText;
    try {
      const parsed = JSON.parse(responseText);
      if (parsed?.reply)     aiReply = parsed.reply;
      if (parsed?.message)   aiReply = parsed.message;
    } catch { /* plain text — use as-is */ }

    if (!aiReply.trim()) throw new Error("AI returned an empty response.");
    setMessages(prev => [...prev,
      { id: `${Date.now()}-ai`, text: aiReply.trim(), sender: "ai" }]);
  } catch (error) {
    console.error("AI Chat Error:", error);
    setMessages(prev => [...prev, {
      id: `${Date.now()}-error`, sender: "ai",
      text: "Sorry, I couldn't connect to the AI server. Please make sure the backend is running on port 3000."
    }]);
  } finally {
    setLoading(false);
  }
};
```

UI pieces:
- Header (back button → `router.back()`, "StudyMate AI" + green online dot)
- `FlatList` bubbles: user right (`#315D91`), AI left (`#111827`) with a "StudyMate AI" label
- While `loading`: a "Thinking…" bubble with three dots
- Input bar: multiline `TextInput` (max 2000) + send button (disabled when empty/loading) + disclaimer text

**Verify against:** `app/ai-chat.tsx`.

---

## Phase 11 — PDF Summary screen

Create **`app/pdf-summary.tsx`** (two functions do all the work):

```tsx
import * as DocumentPicker from "expo-document-picker";

type PDFFile = { name: string; uri: string; size?: number; mimeType?: string };

const [file, setFile] = useState<PDFFile | null>(null);
const [summary, setSummary] = useState("");
const [loading, setLoading] = useState(false);

// 1) Pick a PDF from the device
const pickPDF = async () => {
  const result = await DocumentPicker.getDocumentAsync({
    type: "application/pdf",
    copyToCacheDirectory: true,
  });
  if (result.canceled) return;
  const f = result.assets[0];
  setFile({ name: f.name, uri: f.uri, size: f.size, mimeType: f.mimeType });
  setSummary("");
};

// 2) Upload it to the backend
const summarizePDF = async () => {
  if (!file) { Alert.alert("Select PDF", "Please select a PDF first."); return; }
  setLoading(true);
  setSummary("");
  try {
    const formData = new FormData();
    formData.append("pdf", {
      uri: file.uri, name: file.name, type: "application/pdf",
    } as any);

    const response = await fetch("http://10.0.2.2:3000/summarize-pdf", {
      method: "POST",
      body: formData,          // no Content-Type header — FormData sets it
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to summarize PDF.");
    setSummary(data.summary);
  } catch (error) {
    Alert.alert("Summary Error",
      "Could not connect to the AI server. Please make sure the backend is running.");
  } finally {
    setLoading(false);
  }
};
```

UI pieces: hero icon, dashed upload box (tap → `pickPDF`), selected-file card
(name + `formatFileSize()` helper), "Summarize PDF" button (disabled until a
file exists; shows spinner while working), AI Summary card rendering
`summary`, small info text.

**Verify against:** `app/pdf-summary.tsx`.

---

## Phase 12 — AI Quiz screen

Create **`app/quiz.tsx`**. Think of it as a **4-state machine**:
`setup → loading → questions → result`.

```tsx
type Question = { question: string; options: string[];
                  correctAnswer: number; explanation: string };
type QuizData = { topic: string; difficulty: string; questions: Question[] };

const [topic, setTopic] = useState("");
const [numberOfQuestions, setNumberOfQuestions] = useState(5);  // chips: 5/10/15
const [difficulty, setDifficulty] = useState("medium");        // chips: easy/medium/hard
const [loading, setLoading] = useState(false);
const [quiz, setQuiz] = useState<QuizData | null>(null);
const [currentQuestion, setCurrentQuestion] = useState(0);
const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
const [score, setScore] = useState(0);
const [showResult, setShowResult] = useState(false);

// SETUP → questions
const generateQuiz = async () => {
  if (!topic.trim()) { Alert.alert("Topic Required", "Please enter a topic."); return; }
  setLoading(true); setQuiz(null); setCurrentQuestion(0);
  setSelectedAnswer(null); setScore(0); setShowResult(false);
  try {
    const response = await fetch("http://10.0.2.2:3000/generate-quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: topic.trim(), numberOfQuestions, difficulty }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to generate quiz.");
    setQuiz(data);
  } catch (error) {
    Alert.alert("Quiz Error", "Could not connect to the AI server. Make sure the backend is running.");
  } finally { setLoading(false); }
};

// Answer selection (locks the question, scores it)
const selectAnswer = (optionIndex: number) => {
  if (selectedAnswer !== null || !quiz) return;
  const question = quiz.questions[currentQuestion];
  if (!question) return;
  setSelectedAnswer(optionIndex);
  if (optionIndex === question.correctAnswer) {
    setScore(prev => prev + 1);
  }
};

// Next question — or finish
const nextQuestion = () => {
  if (currentQuestion < quiz.questions.length - 1) {
    setCurrentQuestion(prev => prev + 1);
    setSelectedAnswer(null);
  } else {
    setShowResult(true);
  }
};

// Result → back to setup
const restartQuiz = () => {
  setQuiz(null); setCurrentQuestion(0); setSelectedAnswer(null);
  setScore(0); setShowResult(false);
};
```

UI pieces (render conditionally on the state machine):
1. **Setup card** — topic input, 5/10/15 chips, easy/medium/hard chips, Generate button
2. **Loading card** — spinner + "Generating Questions…"
3. **Question view** — "Question X of Y" + score badge + progress bar
   (`width: ((current+1)/total*100)%`) + question card + 4 option buttons
   (after answering: correct = green ✓, wrong pick = red ✕, options disabled)
   + explanation card + Next/View Results button
4. **Result card** — 🏆, `score / total`, accuracy % pill, "Create New Quiz"

Option letters: `String.fromCharCode(65 + index)` → A, B, C, D.

**Verify against:** `app/quiz.tsx`.

---

## Phase 13 — Design system (the "premium dark look")

Everything visual in this app comes from five repeated patterns — apply them
consistently and the app looks premium:

1. **Color palette (dark, hardcoded per screen)**
   - Backgrounds: `#0B0F19` (auth/home) · `#0F172A` (feature screens) · `#070B14` (chat)
   - Cards: `#1E293B` or glass `rgba(255,255,255,0.07)` with border `rgba(255,255,255,0.12)`
   - Primary blue `#2563EB` · AI cyan `#38BDF8` · purple `#8B5CF6`
   - Text: white / `#94A3B8` (muted) / `#64748B` (dim)
2. **Glassmorphism card recipe**
   ```ts
   {
     backgroundColor: "rgba(255,255,255,0.07)",
     borderRadius: 22,
     borderWidth: 1,
     borderColor: "rgba(255,255,255,0.12)",
     padding: 18,
   }
   ```
3. **Ambient glow blobs** (welcome/login/register/home):
   ```tsx
   <View style={{ position: "absolute", width: 300, height: 300,
                  borderRadius: 150, backgroundColor: "#7C3AED",
                  top: -60, left: -50, opacity: 0.25 }} />
   ```
   (three of them: purple top-left, pink mid-right, blue bottom-left)
4. **Typography** — Poppins weights via `useFonts` (Phase 5 snippet);
   headings `Poppins_700Bold`/`800ExtraBold`, body `400Regular`.
5. **Icons** — `Ionicons` (`@expo/vector-icons`) for almost everything;
   emoji (📚 ✏️ 🗑️ 🎯 🏆) for playful accents.

**`app.json`** — set your own branding:
```json
{
  "expo": {
    "name": "StudyMate AI",
    "slug": "studymate-ai",
    "scheme": "studymatego",
    "android": {
      "package": "com.yourname.studymateai",
      "adaptiveIcon": { "backgroundColor": "#E6F4FE" }
    }
  }
}
```

**Verify against:** `constants/theme.ts` (template palette), `app.json`, and
any screen's `StyleSheet` for the recipes above.

---

## Phase 14 — Run everything + testing checklist

### Running the two processes
```bash
# Terminal 1 — backend
cd backend && npm start

# Terminal 2 — app
cd .. && npx expo start        # press "a" for the Android emulator
```

### Networking rule (the #1 source of "can't connect" bugs)
| Where the app runs | URL of your backend |
|---|---|
| **Android emulator** | `http://10.0.2.2:3000` (10.0.2.2 = host PC's localhost) |
| **Physical Android phone** | `http://<your-PC-LAN-IP>:3000` (same Wi‑Fi; check `ipconfig` / `ifconfig`) |
| **Web browser (web mode)** | `http://localhost:3000` |

### Test in this order
1. ☐ `curl http://localhost:3000/` → health JSON (backend alive)
2. ☐ Register a user → sign-out prompt → login → land on Home with your name
3. ☐ Logout from Home → back on Login. Cold-restart the app → welcome screen
   (not logged in) / straight to Home (logged in) — the guard works
4. ☐ Notes: create 3 → edit one → delete one → restart app → still there.
   Register a second account → its notes list is empty (per-UID keys work)
5. ☐ Planner: add session → Done → Home shows updated progress + stats
6. ☐ AI Chat: ask a question → streamed answer. Kill backend → error bubble appears
7. ☐ Quiz: 5 easy questions on any topic → answer all → correct/wrong colors,
   explanations, score + accuracy %
8. ☐ PDF: pick a small PDF → summary appears in 6 structured sections
9. ☐ Backend failures: stop backend, hit each AI screen → friendly alerts, no crash

### Troubleshooting table
| Symptom | Cause → Fix |
|---|---|
| "Couldn't connect to the AI server" in all 3 AI screens | Backend not running, or wrong host → check `curl localhost:3000/`; use 10.0.2.2 on emulator |
| Backend exits immediately on start | `GEMINI_API_KEY` missing from `backend/.env` |
| 503 "Gemini temporarily unavailable" | Key invalid/quota exhausted, or model name your key can't use → check AI Studio billing + `GEMINI_MODEL` |
| Chat works in web but not emulator | Wrong URL for the platform (see table above) |
| CORS errors in browser devtools | `app.use(cors())` missing in server.js |
| Notes/planner show another account's data | Storage key not namespaced by `uid` |
| Fonts missing / system font shown | `useFonts` not awaited — render nothing until `fontsLoaded` |
| Register succeeds but name missing on Home | `updateProfile` called before account created, or `displayName` not read from `onAuthStateChanged` |
| PDF upload fails > 10 MB | Multer limit — raise `limits.fileSize` in server.js |

---

## What you can add next (beyond this app)

- **Cloud sync:** move notes/planner from AsyncStorage to **Firebase Firestore**
  (collection per `uid`) so data follows the account across devices
- **Backend auth:** send the Firebase ID token to the backend and verify it
  (`firebase-admin`) so the AI endpoints aren't open to the world
- **Chat history persistence** (currently resets when the screen closes)
- **Auto-retry UI + SSE** for true token-by-token streaming in the chat
- **Automated tests:** Jest + `@testing-library/react-native` for screens,
  Supertest for the API
- **Release builds:** `eas build` (Expo Application Services) → Android APK/AAB
