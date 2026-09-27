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
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
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

export default function RegisterScreen() {
  const router = useRouter();

  // Load Custom Fonts
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    // Check empty fields
    if (
      !name.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      alert("Please fill in all fields.");
      return;
    }

    // Check password match
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    // Check password length
    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Create Firebase account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      // 2. Save Full Name to Firebase profile
      await updateProfile(userCredential.user, {
        displayName: name.trim(),
      });

      // 3. Sign out so the user must login manually
      await signOut(auth);

      // 4. Show success message
      alert("Account created successfully! Please login to continue.");

      // 5. Go to Login screen
      router.replace("/login");
    } catch (error: any) {
      console.error("Registration error:", error);

      if (error.code === "auth/email-already-in-use") {
        alert("This email is already registered.");
      } else if (error.code === "auth/invalid-email") {
        alert("Please enter a valid email address.");
      } else if (error.code === "auth/weak-password") {
        alert("Password must be at least 6 characters.");
      } else {
        alert("Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
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
          {/* Logo / Header Icon */}
          <View style={styles.logoWrapper}>
            <View style={styles.logoGlow} />
            <View style={styles.logoCircle}>
              <Ionicons name="person-add-outline" size={34} color="#38BDF8" />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Start your smarter learning journey
          </Text>

          {/* Main Form Card (Glassmorphism) */}
          <View style={styles.card}>
            {/* Full Name Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color="#94A3B8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor="#64748B"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Email Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color="#94A3B8"
                  style={styles.inputIcon}
                />
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
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#94A3B8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Create a password"
                  placeholderTextColor="#64748B"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
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

            {/* Confirm Password Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color="#94A3B8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm your password"
                  placeholderTextColor="#64748B"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  style={styles.eyeIcon}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={
                      showConfirmPassword
                        ? "eye-off-outline"
                        : "eye-outline"
                    }
                    size={20}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={[
                styles.registerButton,
                isLoading && styles.disabledButton,
              ]}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.registerButtonText}>
                    Create Account
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color="#FFFFFF"
                    style={styles.buttonArrow}
                  />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account?</Text>
            <TouchableOpacity
              onPress={() => router.push("/login")}
              activeOpacity={0.7}
            >
              <Text style={styles.loginLink}> Login</Text>
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
    top: -50,
    left: -50,
    opacity: 0.25,
  },
  bgGlowPink: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#EC4899",
    top: 260,
    right: -80,
    opacity: 0.2,
  },
  bgGlowBlue: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "#2563EB",
    bottom: 20,
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
    paddingVertical: 35,
  },

  // LOGO & HEADER
  logoWrapper: {
    width: 82,
    height: 82,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  logoGlow: {
    position: "absolute",
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "rgba(56, 189, 248, 0.25)",
  },
  logoCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
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
    marginBottom: 24,
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
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    color: "#E2E8F0",
    marginBottom: 7,
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
    height: 50,
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

  // BUTTON
  registerButton: {
    height: 52,
    backgroundColor: "#2563EB",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  disabledButton: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
  },
  buttonArrow: {
    marginLeft: 8,
  },

  // FOOTER
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  loginText: {
    color: "#94A3B8",
    fontSize: 13.5,
    fontFamily: "Poppins_500Medium",
  },
  loginLink: {
    color: "#38BDF8",
    fontSize: 13.5,
    fontFamily: "Poppins_700Bold",
  },
});