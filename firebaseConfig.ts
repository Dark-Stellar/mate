import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDcErCix4PFOxUX8E8D16iL1mkXDRUKnRg",
  authDomain: "studymate-ai-d8550.firebaseapp.com",
  projectId: "studymate-ai-d8550",
  storageBucket: "studymate-ai-d8550.firebasestorage.app",
  messagingSenderId: "928078507428",
  appId: "1:928078507428:web:8c55f7be289307782c2531"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);