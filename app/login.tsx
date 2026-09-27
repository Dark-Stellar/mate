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
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { auth } from "../firebaseConfig";

export default function LoginScreen() {
  const router = useRouter();

  // Load Custom Fonts
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Login Function
  const handleLogin = async () => {
    if (!email.trim() || !password) {
      alert("Please enter email and password.");
      return;
    }

    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      alert("Login successful!");
      router.replace("/(tabs)");
    } catch (error: any) {
      console.error("Login error:", error);

      if (error.code === "auth/user-not-found") {
        alert("No account found with this email.");
      } else if (error.code === "auth/wrong-password") {
        alert("Incorrect password.");
      } else if (error.code === "auth/invalid-email") {
        alert("Please enter a valid email address.");
      } else if (error.code === "auth/invalid-credential") {
        alert("Invalid email or password.");
      } else {
        alert("Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password Function
  const handleForgotPassword = async () => {
    if (!email.trim()) {
      alert("Please enter your email first.");
      return;
    }

    try {
      await sendPasswordResetEmail(
        auth,
        email.trim()
      );

      alert(
        "Password reset email sent! Please check your email inbox."
      );
    } catch (error: any) {
      console.error("Password reset error:", error);

      if (error.code === "auth/user-not-found") {
        alert("No account found with this email.");
      } else if (error.code === "auth/invalid-email") {
        alert("Please enter a valid email address.");
      } else {
        alert("Could not send password reset email.");
      }
    }
  };

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

      {/* Ambient Glow Effects */}
      <View style={styles.bgGlowPurple} />
      <View style={styles.bgGlowPink} />
      <View style={styles.bgGlowBlue} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo / Icon */}
          <View style={styles.logoWrapper}>
            <View style={styles.logoGlow} />
            <View style={styles.logoCircle}>
              <Ionicons name="school-outline" size={36} color="#38BDF8" />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Login to continue your learning journey
          </Text>

          {/* Main Glassmorphic Card */}
          <View style={styles.card}>
            {/* Email Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#64748B"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#64748B"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password Link */}
            <TouchableOpacity
              style={styles.forgotButton}
              onPress={handleForgotPassword}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>Login</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={styles.buttonArrow} />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account?</Text>
            <TouchableOpacity
              onPress={() => router.push("/register")}
              activeOpacity={0.7}
            >
              <Text style={styles.registerLink}> Register</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "#7C3AED",
    top: -60,
    left: -60,
    opacity: 0.25,
  },
  bgGlowPink: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#EC4899",
    top: 220,
    right: -80,
    opacity: 0.2,
  },
  bgGlowBlue: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "#2563EB",
    bottom: 40,
    left: -80,
    opacity: 0.22,
  },

  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingVertical: 30,
  },

  // LOGO & HEADER
  logoWrapper: {
    width: 86,
    height: 86,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoGlow: {
    position: "absolute",
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "rgba(56, 189, 248, 0.25)",
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(56, 189, 248, 0.4)",
  },

  title: {
    fontSize: 28,
    fontFamily: "Poppins_800ExtraBold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12.5,
    fontFamily: "Poppins_500Medium",
    color: "#94A3B8",
    textAlign: "center",
    marginBottom: 26,
  },

  // FORM CARD (Glassmorphism)
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },

  inputContainer: {
    marginBottom: 18,
  },
  label: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    color: "#E2E8F0",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: "100%",
    color: "#FFFFFF",
    fontSize: 13.5,
    fontFamily: "Poppins_400Regular",
  },
  eyeIcon: {
    padding: 6,
  },

  forgotButton: {
    alignSelf: "flex-end",
    marginBottom: 22,
    marginTop: -4,
  },
  forgotText: {
    fontSize: 12.5,
    fontFamily: "Poppins_600SemiBold",
    color: "#38BDF8",
  },

  // BUTTON
  loginButton: {
    height: 52,
    backgroundColor: "#2563EB",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  disabledButton: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
  },
  buttonArrow: {
    marginLeft: 8,
  },

  // FOOTER
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  registerText: {
    color: "#94A3B8",
    fontSize: 13.5,
    fontFamily: "Poppins_500Medium",
  },
  registerLink: {
    color: "#38BDF8",
    fontSize: 13.5,
    fontFamily: "Poppins_700Bold",
  },
});