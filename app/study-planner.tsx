import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebaseConfig";

import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type StudySession = {
  id: string;
  subject: string;
  date: string;
  duration: string;
  completed: boolean;
};

export default function StudyPlannerScreen() {
  const router = useRouter();

  const [subject, setSubject] = useState("");
  const [date, setDate] = useState("");
  const [duration, setDuration] = useState("");

  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // --------------------------------------------------
  // FIREBASE USER
  // --------------------------------------------------

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        if (currentUser) {
          setUserId(currentUser.uid);
        } else {
          setUserId(null);
          setSessions([]);
        }

        setAuthLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  // --------------------------------------------------
  // LOAD USER'S STUDY SESSIONS
  // --------------------------------------------------

  useEffect(() => {
    if (!userId) {
      return;
    }

    loadSessions(userId);
  }, [userId]);

  const getStorageKey = (uid: string) => {
    return `studymate_study_sessions_${uid}`;
  };

  const loadSessions = async (uid: string) => {
    try {
      const storageKey = getStorageKey(uid);

      const savedSessions =
        await AsyncStorage.getItem(storageKey);

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
      console.error("Load sessions error:", error);
      setSessions([]);
    }
  };

  // --------------------------------------------------
  // SAVE USER'S STUDY SESSIONS
  // --------------------------------------------------

  const saveSessions = async (
    updatedSessions: StudySession[]
  ) => {
    try {
      if (!userId) {
        Alert.alert(
          "Login Required",
          "Please login first."
        );
        return;
      }

      const storageKey = getStorageKey(userId);

      await AsyncStorage.setItem(
        storageKey,
        JSON.stringify(updatedSessions)
      );

      setSessions(updatedSessions);
    } catch (error) {
      console.error("Save sessions error:", error);

      Alert.alert(
        "Error",
        "Could not save your study session."
      );
    }
  };

  // --------------------------------------------------
  // ADD SESSION
  // --------------------------------------------------

  const addSession = async () => {
    if (!userId) {
      Alert.alert(
        "Login Required",
        "Please login first."
      );
      return;
    }

    if (!subject.trim()) {
      Alert.alert(
        "Missing Subject",
        "Please enter a subject."
      );
      return;
    }

    if (!date.trim()) {
      Alert.alert(
        "Missing Date",
        "Please enter a date."
      );
      return;
    }

    if (!duration.trim()) {
      Alert.alert(
        "Missing Duration",
        "Please enter study duration."
      );
      return;
    }

    const newSession: StudySession = {
      id: Date.now().toString(),
      subject: subject.trim(),
      date: date.trim(),
      duration: duration.trim(),
      completed: false,
    };

    const updatedSessions = [
      newSession,
      ...sessions,
    ];

    await saveSessions(updatedSessions);

    setSubject("");
    setDate("");
    setDuration("");

    Alert.alert(
      "Success",
      "Study session added successfully!"
    );
  };

  // --------------------------------------------------
  // COMPLETE / UNDO SESSION
  // --------------------------------------------------

  const toggleComplete = async (id: string) => {
    if (!userId) {
      Alert.alert(
        "Login Required",
        "Please login first."
      );
      return;
    }

    const updatedSessions = sessions.map(
      (session) =>
        session.id === id
          ? {
              ...session,
              completed: !session.completed,
            }
          : session
    );

    await saveSessions(updatedSessions);
  };

  // --------------------------------------------------
  // DELETE SESSION
  // --------------------------------------------------

  const deleteSession = (id: string) => {
    if (!userId) {
      Alert.alert(
        "Login Required",
        "Please login first."
      );
      return;
    }

    Alert.alert(
      "Delete Session",
      "Are you sure you want to delete this study session?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const updatedSessions =
              sessions.filter(
                (session) => session.id !== id
              );

            await saveSessions(updatedSessions);
          },
        },
      ]
    );
  };

  // --------------------------------------------------
  // PROGRESS
  // --------------------------------------------------

  const completedCount = sessions.filter(
    (session) => session.completed
  ).length;

  const progressPercentage =
    sessions.length > 0
      ? Math.round(
          (completedCount / sessions.length) * 100
        )
      : 0;

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="#0F172A"
        />

        <View style={styles.loadingContainer}>
          <Text style={styles.loadingIcon}>📚</Text>

          <Text style={styles.loadingText}>
            Loading your study planner...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // --------------------------------------------------
  // NOT LOGGED IN
  // --------------------------------------------------

  if (!userId) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="#0F172A"
        />

        <View style={styles.loginContainer}>
          <Text style={styles.loginIcon}>🔐</Text>

          <Text style={styles.loginTitle}>
            Login Required
          </Text>

          <Text style={styles.loginText}>
            Please login to use your personal study planner.
          </Text>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.replace("/login")}
            activeOpacity={0.85}
          >
            <Text style={styles.loginButtonText}>
              Go to Login
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // --------------------------------------------------
  // MAIN UI
  // --------------------------------------------------

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0F172A"
      />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        {/* HEADER */}

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>

          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>
              Study Planner
            </Text>

            <Text style={styles.headerSubtitle}>
              Plan your study sessions
            </Text>
          </View>
        </View>

        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          ListHeaderComponent={
            <>
              {/* INTRO */}

              <View style={styles.introCard}>
                <View style={styles.introIcon}>
                  <Text style={styles.calendarIcon}>
                    📅
                  </Text>
                </View>

                <View
                  style={styles.introTextContainer}
                >
                  <Text style={styles.introTitle}>
                    Organize Your Study
                  </Text>

                  <Text style={styles.introText}>
                    Create a simple study plan and stay
                    consistent.
                  </Text>
                </View>
              </View>

              {/* PROGRESS */}

              <View style={styles.progressCard}>
                <View>
                  <Text style={styles.progressLabel}>
                    Study Progress
                  </Text>

                  <Text style={styles.progressNumber}>
                    {completedCount} / {sessions.length}
                  </Text>
                </View>

                <View style={styles.progressCircle}>
                  <Text style={styles.progressPercent}>
                    {progressPercentage}%
                  </Text>
                </View>
              </View>

              {/* ADD SESSION */}

              <Text style={styles.sectionTitle}>
                Add Study Session
              </Text>

              <View style={styles.formCard}>
                <Text style={styles.inputLabel}>
                  Subject
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="e.g. Data Structures"
                  placeholderTextColor="#64748B"
                  value={subject}
                  onChangeText={setSubject}
                />

                <Text style={styles.inputLabel}>
                  Date
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="e.g. 30 August 2026"
                  placeholderTextColor="#64748B"
                  value={date}
                  onChangeText={setDate}
                />

                <Text style={styles.inputLabel}>
                  Duration
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="e.g. 2 hours"
                  placeholderTextColor="#64748B"
                  value={duration}
                  onChangeText={setDuration}
                />

                <TouchableOpacity
                  style={styles.addButton}
                  onPress={addSession}
                  activeOpacity={0.85}
                >
                  <Text style={styles.addButtonIcon}>
                    ＋
                  </Text>

                  <Text style={styles.addButtonText}>
                    Add Study Session
                  </Text>
                </TouchableOpacity>
              </View>

              {/* SESSION HEADER */}

              <View style={styles.sessionsHeader}>
                <Text style={styles.sectionTitle}>
                  My Study Sessions
                </Text>

                <Text style={styles.sessionCount}>
                  {sessions.length} session
                  {sessions.length !== 1
                    ? "s"
                    : ""}
                </Text>
              </View>
            </>
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.sessionCard,
                item.completed &&
                  styles.completedCard,
              ]}
            >
              <View
                style={[
                  styles.sessionIcon,
                  item.completed &&
                    styles.completedIcon,
                ]}
              >
                <Text style={styles.sessionEmoji}>
                  {item.completed ? "✅" : "📚"}
                </Text>
              </View>

              <View style={styles.sessionInfo}>
                <Text
                  style={[
                    styles.sessionSubject,
                    item.completed &&
                      styles.completedText,
                  ]}
                  numberOfLines={1}
                >
                  {item.subject}
                </Text>

                <Text style={styles.sessionDetails}>
                  📅 {item.date}
                </Text>

                <Text style={styles.sessionDetails}>
                  ⏱ {item.duration}
                </Text>
              </View>

              <View style={styles.sessionActions}>
                <TouchableOpacity
                  style={styles.completeButton}
                  onPress={() =>
                    toggleComplete(item.id)
                  }
                  activeOpacity={0.7}
                >
                  <Text
                    style={
                      styles.completeButtonText
                    }
                  >
                    {item.completed
                      ? "Undo"
                      : "Done"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() =>
                    deleteSession(item.id)
                  }
                  activeOpacity={0.7}
                >
                  <Text
                    style={
                      styles.deleteButtonText
                    }
                  >
                    🗑️
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>
                📖
              </Text>

              <Text style={styles.emptyTitle}>
                No Study Sessions Yet
              </Text>

              <Text style={styles.emptyText}>
                Add your first study session above to
                start planning.
              </Text>
            </View>
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --------------------------------------------------
// STYLES
// --------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },

  keyboardContainer: {
    flex: 1,
  },

  // LOADING

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  loadingIcon: {
    fontSize: 45,
    marginBottom: 15,
  },

  loadingText: {
    color: "#CBD5E1",
    fontSize: 15,
    fontWeight: "600",
  },

  // LOGIN

  loginContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  loginIcon: {
    fontSize: 55,
    marginBottom: 18,
  },

  loginTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#F8FAFC",
    marginBottom: 10,
  },

  loginText: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 25,
  },

  loginButton: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },

  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  // HEADER

  header: {
    height: 72,
    backgroundColor: "#1E293B",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
  },

  backIcon: {
    fontSize: 28,
    color: "#F8FAFC",
    marginTop: -3,
  },

  headerTextContainer: {
    flex: 1,
    marginLeft: 14,
  },

  headerTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#F8FAFC",
    letterSpacing: 0.3,
  },

  headerSubtitle: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },

  // INTRO

  introCard: {
    backgroundColor: "#1E293B",
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },

  introIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  calendarIcon: {
    fontSize: 24,
  },

  introTextContainer: {
    flex: 1,
  },

  introTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#F8FAFC",
  },

  introText: {
    fontSize: 12,
    color: "#94A3B8",
    lineHeight: 18,
    marginTop: 4,
  },

  // PROGRESS

  progressCard: {
    marginTop: 16,
    backgroundColor: "#8B5CF6",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#8B5CF6",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  progressLabel: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 12,
    fontWeight: "600",
  },

  progressNumber: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
    marginTop: 4,
  },

  progressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  progressPercent: {
    color: "#8B5CF6",
    fontSize: 15,
    fontWeight: "800",
  },

  // FORM

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#F8FAFC",
    marginTop: 24,
    marginBottom: 14,
  },

  formCard: {
    backgroundColor: "#1E293B",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#334155",
  },

  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#CBD5E1",
    marginBottom: 6,
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 14,
    color: "#F8FAFC",
    marginBottom: 14,
    backgroundColor: "#0F172A",
  },

  addButton: {
    height: 50,
    borderRadius: 14,
    backgroundColor: "#8B5CF6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    shadowColor: "#8B5CF6",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  addButtonIcon: {
    color: "#FFFFFF",
    fontSize: 20,
    marginRight: 8,
    fontWeight: "600",
  },

  addButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  // SESSION HEADER

  sessionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sessionCount: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8B5CF6",
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 16,
  },

  // SESSION CARD

  sessionCard: {
    backgroundColor: "#1E293B",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },

  completedCard: {
    opacity: 0.65,
  },

  sessionIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  completedIcon: {
    backgroundColor: "rgba(34, 197, 94, 0.2)",
  },

  sessionEmoji: {
    fontSize: 22,
  },

  sessionInfo: {
    flex: 1,
  },

  sessionSubject: {
    fontSize: 15,
    fontWeight: "800",
    color: "#F8FAFC",
    marginBottom: 4,
  },

  completedText: {
    textDecorationLine: "line-through",
    color: "#94A3B8",
  },

  sessionDetails: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },

  sessionActions: {
    alignItems: "center",
    marginLeft: 10,
    gap: 8,
  },

  completeButton: {
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },

  completeButtonText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#C4B5FD",
  },

  deleteButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  deleteButtonText: {
    fontSize: 14,
  },

  // EMPTY

  emptyContainer: {
    backgroundColor: "#1E293B",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
    marginTop: 10,
  },

  emptyIcon: {
    fontSize: 38,
    marginBottom: 10,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#F8FAFC",
  },

  emptyText: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 18,
    marginTop: 6,
  },
});