import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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

type PDFFile = {
  name: string;
  uri: string;
  size?: number;
  mimeType?: string;
};

export default function PDFSummaryScreen() {
  const router = useRouter();

  const [file, setFile] = useState<PDFFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");

  // =========================================
  // PICK PDF
  // =========================================

  const pickPDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const selectedFile = result.assets[0];

      setFile({
        name: selectedFile.name,
        uri: selectedFile.uri,
        size: selectedFile.size,
        mimeType: selectedFile.mimeType,
      });

      setSummary("");

      Alert.alert(
        "PDF Selected",
        `${selectedFile.name}\n\nYour PDF is ready for summarization.`
      );
    } catch (error) {
      console.error("PDF picker error:", error);

      Alert.alert("Error", "Could not select the PDF. Please try again.");
    }
  };

  // =========================================
  // SUMMARIZE PDF
  // =========================================

  const summarizePDF = async () => {
    if (!file) {
      Alert.alert("Select PDF", "Please select a PDF first.");
      return;
    }

    setLoading(true);
    setSummary("");

    try {
      const formData = new FormData();

      formData.append("pdf", {
        uri: file.uri,
        name: file.name,
        type: "application/pdf",
      } as any);

      /*
       * IMPORTANT
       *
       * Android Emulator:
       * 10.0.2.2 = PC localhost
       *
       * Backend:
       * http://localhost:3000
       */

      const response = await fetch("http://10.0.2.2:3000/summarize-pdf", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to summarize PDF.");
      }

      setSummary(data.summary);
    } catch (error) {
      console.error("PDF Summary Error:", error);

      Alert.alert(
        "Summary Error",
        "Could not connect to the AI server. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // FILE SIZE
  // =========================================

  const formatFileSize = (size?: number) => {
    if (!size) return "";

    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

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
          <Text style={styles.headerTitle}>PDF Summarizer</Text>
          <Text style={styles.headerSubtitle}>
            Turn long PDFs into simple summaries
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          {/* HERO ICON */}
          <View style={styles.heroGlowCircle}>
            <View style={styles.iconContainer}>
              <Text style={styles.pdfIcon}>📄</Text>
            </View>
          </View>

          <Text style={styles.title}>Summarize Your PDF</Text>

          <Text style={styles.description}>
            Upload your study material and let StudyMate AI create a simple and
            easy-to-understand summary.
          </Text>

          {/* UPLOAD BOX */}
          <TouchableOpacity
            style={[styles.uploadBox, file && styles.uploadBoxActive]}
            onPress={pickPDF}
            activeOpacity={0.8}
          >
            <View style={styles.uploadIconCircle}>
              <Text style={styles.uploadIcon}>{file ? "🔄" : "📁"}</Text>
            </View>

            <Text style={styles.uploadTitle}>
              {file ? "Change Selected PDF" : "Choose a PDF File"}
            </Text>

            <Text style={styles.uploadSubtitle} numberOfLines={2}>
              {file ? file.name : "Tap here to browse document files"}
            </Text>
          </TouchableOpacity>

          {/* SELECTED FILE CARD */}
          {file && (
            <View style={styles.fileCard}>
              <View style={styles.fileIconContainer}>
                <Text style={styles.fileIcon}>📄</Text>
              </View>

              <View style={styles.fileInfo}>
                <Text style={styles.fileLabel}>SELECTED DOCUMENT</Text>

                <Text style={styles.fileName} numberOfLines={1}>
                  {file.name}
                </Text>

                {file.size ? (
                  <Text style={styles.fileSize}>
                    {formatFileSize(file.size)}
                  </Text>
                ) : null}
              </View>
            </View>
          )}

          {/* SUMMARIZE BUTTON */}
          <TouchableOpacity
            style={[
              styles.summarizeButton,
              (!file || loading) && styles.disabledButton,
            ]}
            onPress={summarizePDF}
            disabled={!file || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.loadingText}>Creating Summary...</Text>
              </>
            ) : (
              <>
                <Text style={styles.buttonIcon}>✨</Text>
                <Text style={styles.buttonText}>Summarize PDF</Text>
              </>
            )}
          </TouchableOpacity>

          {/* SUMMARY DISPLAY CARD */}
          {summary ? (
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <View style={styles.summaryBadgeIcon}>
                  <Text style={styles.summaryIcon}>✨</Text>
                </View>
                <Text style={styles.summaryTitle}>AI Summary</Text>
              </View>

              <Text style={styles.summaryText}>{summary}</Text>
            </View>
          ) : null}

          <Text style={styles.infoText}>
            StudyMate AI analyzes your PDF and creates a concise, study-friendly
            summary.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A", // Deep Slate Dark Mode
  },

  scrollContent: {
    paddingBottom: 40,
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
    marginRight: 14,
  },

  backIcon: {
    fontSize: 28,
    color: "#F8FAFC",
    marginTop: -3,
  },

  headerTextContainer: {
    flex: 1,
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
    paddingTop: 28,
  },

  // HERO ICON
  heroGlowCircle: {
    alignSelf: "center",
    padding: 10,
    borderRadius: 40,
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    marginBottom: 16,
  },

  iconContainer: {
    width: 68,
    height: 68,
    borderRadius: 24,
    backgroundColor: "#8B5CF6",
    alignItems: "center",
    justifyContent: "center",
  },

  pdfIcon: {
    fontSize: 34,
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#F8FAFC",
    textAlign: "center",
  },

  description: {
    fontSize: 14,
    lineHeight: 22,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 26,
  },

  // UPLOAD BOX
  uploadBox: {
    backgroundColor: "#1E293B",
    borderWidth: 2,
    borderColor: "#334155",
    borderStyle: "dashed",
    borderRadius: 22,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: "center",
  },

  uploadBoxActive: {
    borderColor: "#8B5CF6",
    backgroundColor: "rgba(139, 92, 246, 0.08)",
  },

  uploadIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  uploadIcon: {
    fontSize: 24,
  },

  uploadTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#F8FAFC",
  },

  uploadSubtitle: {
    fontSize: 13,
    color: "#94A3B8",
    marginTop: 6,
    maxWidth: "90%",
    textAlign: "center",
  },

  // FILE CARD
  fileCard: {
    marginTop: 18,
    backgroundColor: "#1E293B",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },

  fileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  fileIcon: {
    fontSize: 24,
  },

  fileInfo: {
    flex: 1,
  },

  fileLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#8B5CF6",
    letterSpacing: 0.8,
    marginBottom: 3,
  },

  fileName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F8FAFC",
  },

  fileSize: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 3,
    fontWeight: "500",
  },

  // SUMMARIZE BUTTON
  summarizeButton: {
    height: 56,
    borderRadius: 18,
    backgroundColor: "#8B5CF6",
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },

  disabledButton: {
    opacity: 0.4,
    shadowOpacity: 0,
    elevation: 0,
  },

  buttonIcon: {
    fontSize: 20,
    marginRight: 8,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  loadingText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 10,
  },

  // SUMMARY CARD
  summaryCard: {
    backgroundColor: "#1E293B",
    borderRadius: 22,
    marginTop: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#334155",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 5,
  },

  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },

  summaryBadgeIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  summaryIcon: {
    fontSize: 16,
  },

  summaryTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#F8FAFC",
  },

  summaryText: {
    fontSize: 15,
    lineHeight: 24,
    color: "#CBD5E1",
    fontWeight: "400",
  },

  infoText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
    textAlign: "center",
    marginTop: 18,
    paddingHorizontal: 15,
  },
});