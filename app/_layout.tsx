import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebaseConfig";

import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const router = useRouter();
  const segments = useSegments();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Firebase authentication listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  // Authentication protection
  useEffect(() => {
    if (loading) return;

    const currentRoute = segments[0];

    const inTabs = currentRoute === "(tabs)";
    const inIndex = currentRoute === "index";

    // ------------------------------------
    // 1. User is NOT logged in
    //    Cannot access Home
    // ------------------------------------
    if (!user && inTabs) {
      router.replace("/login");
      return;
    }

    // ------------------------------------
    // 2. User IS logged in
    //    App opens from Welcome screen
    //    → Go to Home
    // ------------------------------------
    if (user && inIndex) {
      router.replace("/(tabs)");
      return;
    }

    // ------------------------------------
    // IMPORTANT:
    // Do NOT automatically redirect
    // Login or Register to Home.
    //
    // Login screen itself will navigate
    // to Home after successful login.
    //
    // Register screen will navigate
    // to Login after registration.
    // ------------------------------------
  }, [user, loading, segments]);

  // Loading screen
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#F7F9FC",
        }}
      >
        <ActivityIndicator
          size="large"
          color="#4F6EF7"
        />
      </View>
    );
  }

  return (
    <ThemeProvider
      value={
        colorScheme === "dark"
          ? DarkTheme
          : DefaultTheme
      }
    >
      <Stack initialRouteName="index">
        <Stack.Screen
          name="index"
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="login"
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="register"
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="modal"
          options={{
            presentation: "modal",
            title: "Modal",
          }}
        />
      </Stack>

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}