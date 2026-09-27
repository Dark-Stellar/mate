import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/poppins";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function WelcomeScreen() {
  const router = useRouter();

  // Load Custom Fonts
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#38BDF8" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />

      {/* Ambient Glow Background Mesh */}
      <View style={styles.bgGlowPurple} />
      <View style={styles.bgGlowPink} />
      <View style={styles.bgGlowBlue} />

      <View style={styles.content}>
        {/* Animated Main Logo */}
        <View style={styles.logoWrapper}>
          <View style={styles.logoGlow} />
          <View style={styles.logoCircle}>
            <Ionicons name="school-outline" size={44} color="#38BDF8" />
          </View>
        </View>

        {/* Branding Headers */}
        <Text style={styles.title}>StudyMate AI</Text>
        <Text style={styles.subtitle}>Your AI-powered study companion</Text>

        <Text style={styles.description}>
          Ask questions, summarize PDFs, generate quizzes, manage notes, and plan
          your studies — all in one place.
        </Text>

        {/* Feature Highlights (Glass Cards) */}
        <View style={styles.features}>
          <View style={styles.featureCard}>
            <View style={styles.featureIconWrapper}>
              <Ionicons name="chatbubbles-outline" size={22} color="#38BDF8" />
            </View>
            <Text style={styles.featureText}>AI Chat</Text>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIconWrapper}>
              <Ionicons name="document-text-outline" size={22} color="#A855F7" />
            </View>
            <Text style={styles.featureText}>PDF Summary</Text>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIconWrapper}>
              <Ionicons name="sparkles-outline" size={22} color="#EC4899" />
            </View>
            <Text style={styles.featureText}>AI Quiz</Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/login")}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={styles.arrow} />
        </TouchableOpacity>

        {/* Footer Tagline */}
        <Text style={styles.footer}>
          Study smarter • Learn better • Achieve more
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0B0F19",
  },
  container: {
    flex: 1,
    backgroundColor: "#0B0F19",
  },

  // Glowing Ambient Background Effects
  bgGlowPurple: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#7C3AED",
    top: -60,
    left: -50,
    opacity: 0.25,
  },
  bgGlowPink: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "#EC4899",
    top: "35%",
    right: -90,
    opacity: 0.2,
  },
  bgGlowBlue: {
    position: "absolute",
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: "#2563EB",
    bottom: -60,
    left: -80,
    opacity: 0.25,
  },

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 26,
  },

  // LOGO & HEADER
  logoWrapper: {
    width: 96,
    height: 96,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  logoGlow: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(56, 189, 248, 0.25)",
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(56, 189, 248, 0.4)",
  },

  title: {
    fontSize: 34,
    fontFamily: "Poppins_800ExtraBold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
    color: "#38BDF8",
    textAlign: "center",
    marginBottom: 14,
  },
  description: {
    fontSize: 13.5,
    fontFamily: "Poppins_400Regular",
    lineHeight: 22,
    color: "#94A3B8",
    textAlign: "center",
    maxWidth: 320,
    marginBottom: 32,
  },

  // FEATURE CARDS (GLASSMORPHISM)
  features: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 36,
  },
  featureCard: {
    alignItems: "center",
    width: "31%",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  featureIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  featureText: {
    fontSize: 11.5,
    fontFamily: "Poppins_600SemiBold",
    color: "#E2E8F0",
    textAlign: "center",
  },

  // BUTTON
  button: {
    width: "100%",
    height: 54,
    backgroundColor: "#2563EB",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
  },
  arrow: {
    marginLeft: 8,
  },

  // FOOTER
  footer: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: "#64748B",
    textAlign: "center",
  },
});