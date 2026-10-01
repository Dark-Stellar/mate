import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function ExploreScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.smallTitle}>STUDYMATE AI</Text>

            <Text style={styles.title}>About Us</Text>

            <Text style={styles.subtitle}>
              Meet the developers behind StudyMate AI
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Ionicons
              name="people"
              size={23}
              color="#38BDF8"
            />
          </View>
        </View>

        {/* Main Card */}
        <View style={styles.mainCard}>
          <View style={styles.sparkleCircle}>
            <Ionicons
              name="sparkles"
              size={22}
              color="#38BDF8"
            />
          </View>

          <Text style={styles.mainTitle}>
            StudyMate AI
          </Text>

          <Text style={styles.mainDescription}>
            An AI-powered study companion designed to
            help students learn smarter, stay organized,
            and achieve their academic goals.
          </Text>
        </View>

        {/* Team Section */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Our Team
            </Text>

            <Text style={styles.sectionSubtitle}>
              Project Developers
            </Text>
          </View>

          <View style={styles.teamBadge}>
            <Text style={styles.teamBadgeText}>
              2 MEMBERS
            </Text>
          </View>
        </View>

        {/* Member 1 */}
        <View style={styles.memberCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>S</Text>
          </View>

          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>
              Sanjit Sharif
            </Text>

            <Text style={styles.memberRole}>
              CSE Student
            </Text>

            <View style={styles.idRow}>
              <Ionicons
                name="card-outline"
                size={14}
                color="#38BDF8"
              />

              <Text style={styles.memberId}>
                ID: 2023100000308
              </Text>
            </View>
          </View>
        </View>

        {/* Member 2 */}
        <View style={styles.memberCard}>
          <View style={[styles.avatar, styles.avatarSecond]}>
            <Text style={styles.avatarText}>A</Text>
          </View>

          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>
              Abdullah Al Fahad
            </Text>

            <Text style={styles.memberRole}>
              CSE Student
            </Text>

            <View style={styles.idRow}>
              <Ionicons
                name="card-outline"
                size={14}
                color="#38BDF8"
              />

              <Text style={styles.memberId}>
                ID: 2023100000289
              </Text>
            </View>
          </View>
        </View>

        {/* Project Footer */}
        <View style={styles.footerCard}>
          <View style={styles.footerIcon}>
            <Ionicons
              name="code-slash"
              size={20}
              color="#38BDF8"
            />
          </View>

          <Text style={styles.footerTitle}>
            Developed with AI & Technology
          </Text>

          <Text style={styles.footerText}>
            StudyMate AI — Your AI-powered study
            companion.
          </Text>

          <Text style={styles.copyright}>
            © 2026 StudyMate AI
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080B12",
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 35,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },

  smallTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "#38BDF8",
    marginBottom: 5,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 13,
    color: "#8F9AAF",
  },

  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(56, 189, 248, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },

  mainCard: {
    backgroundColor: "#171C27",
    borderRadius: 24,
    padding: 22,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.16)",
    alignItems: "center",
  },

  sparkleCircle: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: "rgba(56, 189, 248, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  mainTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
  },

  mainDescription: {
    color: "#8994A8",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "800",
    marginBottom: 4,
  },

  sectionSubtitle: {
    color: "#788398",
    fontSize: 12,
  },

  teamBadge: {
    backgroundColor: "rgba(56, 189, 248, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.25)",
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  teamBadgeText: {
    color: "#38BDF8",
    fontSize: 9,
    fontWeight: "800",
  },

  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#171C27",
    borderRadius: 20,
    padding: 16,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.14)",
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 19,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },

  avatarSecond: {
    backgroundColor: "#9333EA",
  },

  avatarText: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "800",
  },

  memberInfo: {
    flex: 1,
  },

  memberName: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 3,
  },

  memberRole: {
    color: "#8994A8",
    fontSize: 12,
    marginBottom: 7,
  },

  idRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  memberId: {
    color: "#38BDF8",
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 5,
  },

  footerCard: {
    backgroundColor: "#111722",
    borderRadius: 20,
    padding: 20,
    marginTop: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.12)",
  },

  footerIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(56, 189, 248, 0.10)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  footerTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 5,
  },

  footerText: {
    color: "#7F8A9E",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
  },

  copyright: {
    color: "#4F6078",
    fontSize: 10,
    marginTop: 14,
  },
});