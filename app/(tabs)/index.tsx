import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/poppins";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import React, {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { auth } from "../../firebaseConfig";

type StudySession = {
  id: string;
  subject: string;
  date: string;
  duration: string;
  completed: boolean;
};

export default function HomeScreen() {
  const router = useRouter();

  // Load Custom Fonts
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [userName, setUserName] = useState("Student");
  const [userId, setUserId] = useState<string | null>(null);

  // ===============================
  // GET FIREBASE USER NAME & UID
  // ===============================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        const name =
          currentUser?.displayName?.trim() || "Student";

        setUserName(name);
        setUserId(currentUser?.uid || null);
      }
    );

    return unsubscribe;
  }, []);

  // ===============================
  // LOAD STUDY PLANNER DATA
  // ===============================
  const loadStudySessions = useCallback(async (uid: string | null) => {
    if (!uid) {
      setSessions([]);
      return;
    }
    try {
      const storageKey = `studymate_study_sessions_${uid}`;
      const savedSessions = await AsyncStorage.getItem(storageKey);

      if (savedSessions) {
        const parsedSessions = JSON.parse(savedSessions);
        if (Array.isArray(parsedSessions)) {
          setSessions(parsedSessions);
        } else {
          setSessions([]);
        }
      } else {
        setSessions([]);
      }
    } catch (error) {
      console.error(
        "Load study sessions error:",
        error
      );
      setSessions([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        loadStudySessions(userId);
      } else {
        setSessions([]);
      }
    }, [userId, loadStudySessions])
  );

  // ===============================
  // SIGN OUT
  // ===============================
  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut(auth);

              router.replace("/login");
            } catch (error) {
              console.error(
                "Sign out error:",
                error
              );

              Alert.alert(
                "Sign Out Failed",
                "Something went wrong. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  // Prevent rendering before fonts are loaded
  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#3B82F6"
        />
      </View>
    );
  }

  // ===============================
  // PROGRESS CALCULATIONS
  // ===============================
  const totalSessions = sessions.length;

  const completedSessions = sessions.filter(
    (session) => session.completed
  ).length;

  const remainingSessions =
    totalSessions - completedSessions;

  const progressPercent =
    totalSessions > 0
      ? Math.round(
          (completedSessions / totalSessions) * 100
        )
      : 0;

  // ===============================
  // GET INITIALS
  // ===============================
  const getInitials = () => {
    const parts = userName
      .trim()
      .split(" ")
      .filter(Boolean);

    if (parts.length === 1) {
      return parts[0]
        .charAt(0)
        .toUpperCase();
    }

    return (
      parts[0].charAt(0) +
      parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0B0F19"
      />

      {/* Colorful Ambient Glow Effects */}
      <View style={styles.bgGlowPurple} />
      <View style={styles.bgGlowPink} />
      <View style={styles.bgGlowBlue} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* =========================================
            HEADER
        ========================================= */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.smallGreetingBox}>
              <Text style={styles.smallGreeting}>
                WELCOME BACK
              </Text>

              <Ionicons
                name="hand-left"
                size={12}
                color="#38BDF8"
                style={{ marginLeft: 4 }}
              />
            </View>

            <Text style={styles.greeting}>
              Hello, {userName}!
            </Text>

            <Text style={styles.subtitle}>
              Ready to make today productive?
            </Text>
          </View>

          <View style={styles.profileWrapper}>
            <View style={styles.profileGlow} />

            <View style={styles.profileCircle}>
              <Text style={styles.profileText}>
                {getInitials()}
              </Text>
            </View>

            <View style={styles.onlineDot} />
          </View>

          {/* SIGN OUT BUTTON */}
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
            activeOpacity={0.8}
          >
            <Ionicons
              name="log-out-outline"
              size={16}
              color="#F87171"
            />

            <Text style={styles.signOutText}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>

        {/* =========================================
            AI HERO / PROGRESS CARD
        ========================================= */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.aiBadge}>
              <Ionicons
                name="sparkles"
                size={11}
                color="#38BDF8"
              />

              <Text style={styles.aiBadgeText}>
                AI STUDY ASSISTANT
              </Text>
            </View>

            <View style={styles.sparkleCircle}>
              <Ionicons
                name="sparkles-outline"
                size={16}
                color="#38BDF8"
              />
            </View>
          </View>

          <View style={styles.heroMain}>
            <View style={styles.heroTextContainer}>
              <Text style={styles.heroTitle}>
                Your learning
              </Text>

              <Text style={styles.heroTitleAccent}>
                journey continues.
              </Text>

              <Text style={styles.heroDescription}>
                Stay consistent, learn smarter and
                achieve your goals with StudyMate AI.
              </Text>
            </View>

            <View style={styles.heroRobot}>
              <MaterialCommunityIcons
                name="robot"
                size={32}
                color="#38BDF8"
              />
            </View>
          </View>

          {/* Progress */}
          <View style={styles.heroProgressSection}>
            <View style={styles.progressHeader}>
              <View>
                <Text style={styles.progressTitle}>
                  Today's Progress
                </Text>

                <Text style={styles.progressSubtitle}>
                  {totalSessions > 0
                    ? "Keep going, you're doing great!"
                    : "Start your first study session!"}
                </Text>
              </View>

              <View style={styles.percentCircle}>
                <Text style={styles.progressPercent}>
                  {progressPercent}%
                </Text>
              </View>
            </View>

            <View style={styles.progressBackground}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progressPercent}%`,
                  },
                ]}
              />
            </View>

            <View style={styles.progressFooter}>
              <Text style={styles.progressSmall}>
                {completedSessions} completed
              </Text>

              <Text style={styles.progressSmall}>
                {remainingSessions} remaining
              </Text>
            </View>
          </View>
        </View>

        {/* =========================================
            SECTION TITLE
        ========================================= */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Smart Study Tools
            </Text>

            <Text style={styles.sectionSubtitle}>
              Everything you need to study smarter
            </Text>
          </View>

          <View style={styles.aiMiniBadge}>
            <Text style={styles.aiMiniText}>
              AI
            </Text>
          </View>
        </View>

        {/* =========================================
            FEATURE GRID
        ========================================= */}
        <View style={styles.featureGrid}>
          {/* AI CHAT */}
          <TouchableOpacity
            style={styles.featureCard}
            onPress={() => router.push("/ai-chat")}
            activeOpacity={0.85}
          >
            <View
              style={[
                styles.featureIconBox,
                styles.chatIconBox,
              ]}
            >
              <Ionicons
                name="chatbubbles"
                size={22}
                color="#FFFFFF"
              />
            </View>

            <Text style={styles.featureTitle}>
              AI Chat
            </Text>

            <Text style={styles.featureDescription}>
              Ask questions & get instant AI help
            </Text>

            <View style={styles.featureBottom}>
              <Text
                style={[
                  styles.featureAction,
                  { color: "#60A5FA" },
                ]}
              >
                Ask AI
              </Text>

              <Ionicons
                name="arrow-forward"
                size={12}
                color="#60A5FA"
                style={{ marginLeft: 4 }}
              />
            </View>
          </TouchableOpacity>

          {/* PDF SUMMARY */}
          <TouchableOpacity
            style={styles.featureCard}
            onPress={() =>
              router.push("/pdf-summary")
            }
            activeOpacity={0.85}
          >
            <View
              style={[
                styles.featureIconBox,
                styles.pdfIconBox,
              ]}
            >
              <Ionicons
                name="document-text"
                size={22}
                color="#FFFFFF"
              />
            </View>

            <Text style={styles.featureTitle}>
              PDF Summary
            </Text>

            <Text style={styles.featureDescription}>
              Turn long study materials into simple
              summaries
            </Text>

            <View style={styles.featureBottom}>
              <Text
                style={[
                  styles.featureAction,
                  { color: "#FBBF24" },
                ]}
              >
                Summarize
              </Text>

              <Ionicons
                name="arrow-forward"
                size={12}
                color="#FBBF24"
                style={{ marginLeft: 4 }}
              />
            </View>
          </TouchableOpacity>

          {/* AI QUIZ */}
          <TouchableOpacity
            style={styles.featureCard}
            onPress={() => router.push("/quiz")}
            activeOpacity={0.85}
          >
            <View
              style={[
                styles.featureIconBox,
                styles.quizIconBox,
              ]}
            >
              <Ionicons
                name="help-circle"
                size={24}
                color="#FFFFFF"
              />
            </View>

            <Text style={styles.featureTitle}>
              AI Quiz
            </Text>

            <Text style={styles.featureDescription}>
              Practice with smart AI-generated
              questions
            </Text>

            <View style={styles.featureBottom}>
              <Text
                style={[
                  styles.featureAction,
                  { color: "#4ADE80" },
                ]}
              >
                Practice
              </Text>

              <Ionicons
                name="arrow-forward"
                size={12}
                color="#4ADE80"
                style={{ marginLeft: 4 }}
              />
            </View>
          </TouchableOpacity>

          {/* MY NOTES */}
          <TouchableOpacity
            style={styles.featureCard}
            onPress={() => router.push("/notes")}
            activeOpacity={0.85}
          >
            <View
              style={[
                styles.featureIconBox,
                styles.notesIconBox,
              ]}
            >
              <Ionicons
                name="journal"
                size={22}
                color="#FFFFFF"
              />
            </View>

            <Text style={styles.featureTitle}>
              My Notes
            </Text>

            <Text style={styles.featureDescription}>
              Organize your important study notes
            </Text>

            <View style={styles.featureBottom}>
              <Text
                style={[
                  styles.featureAction,
                  { color: "#C084FC" },
                ]}
              >
                Open Notes
              </Text>

              <Ionicons
                name="arrow-forward"
                size={12}
                color="#C084FC"
                style={{ marginLeft: 4 }}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* =========================================
            STUDY PLANNER BANNER
        ========================================= */}
        <TouchableOpacity
          style={styles.plannerCard}
          onPress={() =>
            router.push("/study-planner")
          }
          activeOpacity={0.85}
        >
          <View style={styles.plannerIconBox}>
            <Ionicons
              name="calendar"
              size={24}
              color="#FFFFFF"
            />
          </View>

          <View style={styles.plannerContent}>
            <View style={styles.plannerTag}>
              <Text style={styles.plannerTagText}>
                PLAN SMART
              </Text>
            </View>

            <Text style={styles.plannerTitle}>
              Study Planner
            </Text>

            <Text style={styles.plannerDescription}>
              Organize your sessions and build a
              consistent study routine.
            </Text>
          </View>

          <View style={styles.plannerArrowCircle}>
            <Ionicons
              name="arrow-forward"
              size={18}
              color="#FFFFFF"
            />
          </View>
        </TouchableOpacity>

        {/* =========================================
            STUDY OVERVIEW STATS
        ========================================= */}
        <View style={styles.statsHeader}>
          <Text style={styles.statsTitle}>
            Your Study Overview
          </Text>

          <Ionicons
            name="stats-chart"
            size={18}
            color="#38BDF8"
          />
        </View>

        <View style={styles.overviewGrid}>
          {/* Total Sessions */}
          <View style={styles.overviewCard}>
            <View
              style={[
                styles.overviewIconBox,
                { backgroundColor: "#1D4ED8" },
              ]}
            >
              <Ionicons
                name="library"
                size={18}
                color="#FFFFFF"
              />
            </View>

            <Text style={styles.overviewNumber}>
              {totalSessions}
            </Text>

            <Text style={styles.overviewLabel}>
              Total Sessions
            </Text>
          </View>

          {/* Completed */}
          <View style={styles.overviewCard}>
            <View
              style={[
                styles.overviewIconBox,
                { backgroundColor: "#15803D" },
              ]}
            >
              <Ionicons
                name="checkmark"
                size={18}
                color="#FFFFFF"
              />
            </View>

            <Text style={styles.overviewNumber}>
              {completedSessions}
            </Text>

            <Text style={styles.overviewLabel}>
              Completed
            </Text>
          </View>

          {/* Remaining */}
          <View style={styles.overviewCard}>
            <View
              style={[
                styles.overviewIconBox,
                { backgroundColor: "#B45309" },
              ]}
            >
              <Ionicons
                name="hourglass-outline"
                size={18}
                color="#FFFFFF"
              />
            </View>

            <Text style={styles.overviewNumber}>
              {remainingSessions}
            </Text>

            <Text style={styles.overviewLabel}>
              Remaining
            </Text>
          </View>
        </View>

        {/* =========================================
            DAILY AI TIP CARD
        ========================================= */}
        <View style={styles.motivationCard}>
          <View style={styles.motivationIconBox}>
            <Ionicons
              name="bulb"
              size={22}
              color="#F59E0B"
            />
          </View>

          <View style={styles.motivationContent}>
            <View style={styles.motivationTop}>
              <Text style={styles.motivationTag}>
                DAILY AI TIP
              </Text>

              <Ionicons
                name="sparkles"
                size={12}
                color="#F59E0B"
              />
            </View>

            <Text style={styles.motivationTitle}>
              Small steps create big results.
            </Text>

            <Text style={styles.motivationText}>
              Stay consistent today. Your future
              self will thank you.
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
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

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 8,
  },

  headerLeft: {
    flex: 1,
    paddingRight: 12,
  },

  smallGreetingBox: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },

  smallGreeting: {
    fontSize: 10,
    fontFamily: "Poppins_800ExtraBold",
    letterSpacing: 1.2,
    color: "#38BDF8",
  },

  greeting: {
    fontSize: 22,
    fontFamily: "Poppins_800ExtraBold",
    color: "#FFFFFF",
  },

  subtitle: {
    fontSize: 11.5,
    color: "#94A3B8",
    fontFamily: "Poppins_500Medium",
  },

  profileWrapper: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },

  profileGlow: {
    position: "absolute",
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(59, 130, 246, 0.4)",
  },

  profileCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },

  profileText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
  },

  onlineDot: {
    position: "absolute",
    right: 1,
    bottom: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#0B0F19",
  },

  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(248, 113, 113, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(248, 113, 113, 0.25)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginLeft: 8,
  },

  signOutText: {
    color: "#F87171",
    fontSize: 10,
    fontFamily: "Poppins_600SemiBold",
    marginLeft: 4,
  },

  heroCard: {
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    borderRadius: 24,
    padding: 18,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },

  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.3)",
  },

  aiBadgeText: {
    color: "#38BDF8",
    fontSize: 9,
    fontFamily: "Poppins_700Bold",
    letterSpacing: 0.8,
    marginLeft: 5,
  },

  sparkleCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },

  heroMain: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 16,
  },

  heroTextContainer: {
    flex: 1,
    paddingRight: 8,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontFamily: "Poppins_700Bold",
  },

  heroTitleAccent: {
    color: "#38BDF8",
    fontSize: 19,
    fontFamily: "Poppins_800ExtraBold",
  },

  heroDescription: {
    color: "#94A3B8",
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    lineHeight: 16,
    marginTop: 4,
  },

  heroRobot: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.3)",
  },

  heroProgressSection: {
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  progressTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
  },

  progressSubtitle: {
    color: "#94A3B8",
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
  },

  percentCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },

  progressPercent: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: "Poppins_700Bold",
  },

  progressBackground: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#38BDF8",
    borderRadius: 10,
  },

  progressFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },

  progressSmall: {
    color: "#94A3B8",
    fontSize: 9.5,
    fontFamily: "Poppins_500Medium",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 17,
    fontFamily: "Poppins_800ExtraBold",
    color: "#FFFFFF",
  },

  sectionSubtitle: {
    fontSize: 11,
    color: "#94A3B8",
    fontFamily: "Poppins_500Medium",
  },

  aiMiniBadge: {
    width: 32,
    height: 26,
    borderRadius: 8,
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.3)",
  },

  aiMiniText: {
    color: "#38BDF8",
    fontSize: 10,
    fontFamily: "Poppins_800ExtraBold",
  },

  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  featureCard: {
    width: "48.2%",
    minHeight: 165,
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },

  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  chatIconBox: {
    backgroundColor: "#2563EB",
  },

  pdfIconBox: {
    backgroundColor: "#D97706",
  },

  quizIconBox: {
    backgroundColor: "#16A34A",
  },

  notesIconBox: {
    backgroundColor: "#9333EA",
  },

  featureTitle: {
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
    color: "#FFFFFF",
    marginBottom: 2,
  },

  featureDescription: {
    fontSize: 10.5,
    fontFamily: "Poppins_400Regular",
    lineHeight: 15,
    color: "#94A3B8",
  },

  featureBottom: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: "auto",
    paddingTop: 10,
  },

  featureAction: {
    fontSize: 11.5,
    fontFamily: "Poppins_700Bold",
  },

  plannerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(30, 41, 59, 0.7)",
    borderRadius: 22,
    padding: 16,
    marginTop: 2,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.3)",
  },

  plannerIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#1D4ED8",
    alignItems: "center",
    justifyContent: "center",
  },

  plannerContent: {
    flex: 1,
    marginLeft: 12,
    paddingRight: 6,
  },

  plannerTag: {
    alignSelf: "flex-start",
    backgroundColor: "#F59E0B",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginBottom: 4,
  },

  plannerTagText: {
    color: "#000000",
    fontSize: 8,
    fontFamily: "Poppins_800ExtraBold",
    letterSpacing: 0.6,
  },

  plannerTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
  },

  plannerDescription: {
    color: "#94A3B8",
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    lineHeight: 14,
  },

  plannerArrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },

  statsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  statsTitle: {
    fontSize: 17,
    fontFamily: "Poppins_700Bold",
    color: "#FFFFFF",
  },

  overviewGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  overviewCard: {
    width: "31.5%",
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },

  overviewIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  overviewNumber: {
    fontSize: 18,
    fontFamily: "Poppins_800ExtraBold",
    color: "#FFFFFF",
  },

  overviewLabel: {
    fontSize: 9.5,
    fontFamily: "Poppins_500Medium",
    color: "#94A3B8",
    marginTop: 2,
    textAlign: "center",
  },

  motivationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.25)",
  },

  motivationIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },

  motivationContent: {
    flex: 1,
    marginLeft: 12,
  },

  motivationTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },

  motivationTag: {
    fontSize: 8.5,
    fontFamily: "Poppins_800ExtraBold",
    letterSpacing: 1,
    color: "#F59E0B",
  },

  motivationTitle: {
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
    color: "#FFFFFF",
  },

  motivationText: {
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    color: "#94A3B8",
    lineHeight: 14,
    marginTop: 1,
  },

  bottomSpace: {
    height: 20,
  },
});