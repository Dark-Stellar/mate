import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
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

type Message = {
  id: string;
  text: string;
  sender: "user" | "ai";
};

export default function AIChatScreen() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! 👋 I'm your AI study assistant. How can I help you today?",
      sender: "ai",
    },
  ]);

  // =========================
  // SEND MESSAGE
  // =========================
  const sendMessage = async () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || loading) {
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: trimmedMessage,
      sender: "user",
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("http://10.0.2.2:3000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmedMessage,
        }),
      });

      // IMPORTANT:
      // Backend response JSON নাকি plain text
      // সেটা আগে text হিসেবে read করছি।
      const responseText = await response.text();

      console.log("Backend Status:", response.status);
      console.log("Backend Response:", responseText);

      if (!response.ok) {
        throw new Error(
          responseText || `Server error: ${response.status}`
        );
      }

      let aiReply = responseText;

      // যদি backend JSON পাঠায়:
      // {"reply":"Hello"}
      // তাহলে reply বের করে নেব।
      try {
        const parsedData = JSON.parse(responseText);

        if (parsedData?.reply) {
          aiReply = parsedData.reply;
        } else if (parsedData?.message) {
          aiReply = parsedData.message;
        }
      } catch {
        // JSON না হলে plain text হিসেবেই ব্যবহার হবে
        aiReply = responseText;
      }

      if (!aiReply.trim()) {
        throw new Error("AI returned an empty response.");
      }

      const aiMessage: Message = {
        id: `${Date.now()}-ai`,
        text: aiReply.trim(),
        sender: "ai",
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("AI Chat Error:", error);

      const errorMessage: Message = {
        id: `${Date.now()}-error`,
        text:
          "Sorry, I couldn't connect to the AI server. Please make sure the backend is running on port 3000.",
        sender: "ai",
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // RENDER MESSAGE
  // =========================
  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === "user";

    return (
      <View
        style={[
          styles.messageRow,
          isUser ? styles.userRow : styles.aiRow,
        ]}
      >
        {!isUser && (
          <View style={styles.aiAvatar}>
            <Text style={styles.aiAvatarText}>✦</Text>
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.aiBubble,
          ]}
        >
          {!isUser && (
            <Text style={styles.aiLabel}>StudyMate AI</Text>
          )}

          <Text
            style={[
              styles.messageText,
              isUser
                ? styles.userMessageText
                : styles.aiMessageText,
            ]}
          >
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  // =========================
  // MAIN UI
  // =========================
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#070B14"
      />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* ================= HEADER ================= */}

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.headerAiIcon}>
              <Text style={styles.headerAiText}>✦</Text>
            </View>

            <View>
              <Text style={styles.headerTitle}>
                StudyMate AI
              </Text>

              <View style={styles.onlineContainer}>
                <View style={styles.onlineDot} />

                <Text style={styles.onlineText}>
                  AI Assistant
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.moreButton}
            activeOpacity={0.7}
          >
            <Text style={styles.moreIcon}>•••</Text>
          </TouchableOpacity>
        </View>

        {/* ================= CHAT AREA ================= */}

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          style={styles.chatList}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        />

        {/* ================= THINKING ================= */}

        {loading && (
          <View style={styles.typingContainer}>
            <View style={styles.typingAvatar}>
              <Text style={styles.typingAvatarText}>✦</Text>
            </View>

            <View style={styles.typingBubble}>
              <View style={styles.dot} />
              <View style={styles.dot} />
              <View style={styles.dot} />

              <Text style={styles.thinkingText}>
                Thinking...
              </Text>
            </View>
          </View>
        )}

        {/* ================= INPUT ================= */}

        <View style={styles.inputArea}>
          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={styles.plusButton}
              activeOpacity={0.7}
              onPress={() => inputRef.current?.focus()}
            >
              <Text style={styles.plusText}>+</Text>
            </TouchableOpacity>

            <TextInput
              ref={inputRef}
              value={message}
              onChangeText={setMessage}
              placeholder="Ask anything..."
              placeholderTextColor="#737B8F"
              multiline
              maxLength={2000}
              style={styles.textInput}
              textAlignVertical="center"
              returnKeyType="default"
              blurOnSubmit={false}
            />

            <TouchableOpacity
              style={[
                styles.sendButton,
                message.trim() && !loading
                  ? styles.sendButtonActive
                  : styles.sendButtonDisabled,
              ]}
              onPress={sendMessage}
              disabled={!message.trim() || loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
              ) : (
                <Text style={styles.sendIcon}>↑</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.disclaimer}>
            StudyMate AI can make mistakes. Check important
            information.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#070B14",
  },

  keyboardContainer: {
    flex: 1,
    backgroundColor: "#070B14",
  },

  // ================= HEADER =================

  header: {
    height: 76,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: "#090E1A",
    borderBottomWidth: 1,
    borderBottomColor: "#151C2C",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#111827",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#202A3D",
  },

  backIcon: {
    color: "#DCE4F5",
    fontSize: 32,
    lineHeight: 34,
    marginTop: -3,
  },

  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },

  headerAiIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#172A45",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
    borderWidth: 1,
    borderColor: "#31547D",
  },

  headerAiText: {
    color: "#AFCBFF",
    fontSize: 23,
  },

  headerTitle: {
    color: "#F4F7FF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  onlineContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#55D68A",
    marginRight: 6,
  },

  onlineText: {
    color: "#7F8BA3",
    fontSize: 12,
  },

  moreButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#202A3D",
  },

  moreIcon: {
    color: "#AEB8CC",
    fontSize: 16,
    letterSpacing: 2,
    marginTop: -5,
  },

  // ================= CHAT =================

  chatList: {
    flex: 1,
    backgroundColor: "#070B14",
  },

  chatContent: {
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 18,
  },

  messageRow: {
    flexDirection: "row",
    marginBottom: 18,
    alignItems: "flex-end",
  },

  aiRow: {
    justifyContent: "flex-start",
  },

  userRow: {
    justifyContent: "flex-end",
  },

  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: "#172A45",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 9,
    borderWidth: 1,
    borderColor: "#2D4D73",
  },

  aiAvatarText: {
    color: "#AFCBFF",
    fontSize: 17,
  },

  messageBubble: {
    maxWidth: "78%",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 18,
  },

  aiBubble: {
    backgroundColor: "#111827",
    borderTopLeftRadius: 5,
    borderWidth: 1,
    borderColor: "#1D273A",
  },

  userBubble: {
    backgroundColor: "#315D91",
    borderBottomRightRadius: 5,
    borderWidth: 1,
    borderColor: "#4778B1",
  },

  aiLabel: {
    color: "#8FAFDC",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 5,
    letterSpacing: 0.3,
  },

  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },

  aiMessageText: {
    color: "#DCE4F3",
  },

  userMessageText: {
    color: "#FFFFFF",
  },

  // ================= THINKING =================

  typingContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },

  typingAvatar: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: "#172A45",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 9,
  },

  typingAvatarText: {
    color: "#AFCBFF",
    fontSize: 16,
  },

  typingBubble: {
    minHeight: 42,
    paddingHorizontal: 13,
    borderRadius: 15,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1D273A",
    flexDirection: "row",
    alignItems: "center",
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#91A9D1",
    marginHorizontal: 2,
  },

  thinkingText: {
    color: "#7F8BA3",
    fontSize: 12,
    marginLeft: 7,
  },

  // ================= INPUT =================

  inputArea: {
    backgroundColor: "#090E1A",
    borderTopWidth: 1,
    borderTopColor: "#151C2C",
    paddingTop: 9,
    paddingBottom: 7,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 14,
    paddingTop: 5,
    paddingBottom: 5,
  },

  plusButton: {
    width: 42,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#202A3D",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },

  plusText: {
    color: "#A9B6CC",
    fontSize: 27,
    fontWeight: "300",
    marginTop: -2,
  },

  textInput: {
    flex: 1,
    minHeight: 46,
    maxHeight: 120,
    borderRadius: 15,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#202A3D",
    color: "#F2F5FB",
    fontSize: 15,
    paddingHorizontal: 14,
    paddingTop: 11,
    paddingBottom: 11,
    marginRight: 8,
  },

  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },

  sendButtonActive: {
    backgroundColor: "#4778B1",
    borderWidth: 1,
    borderColor: "#6194D0",
  },

  sendButtonDisabled: {
    backgroundColor: "#182131",
    borderWidth: 1,
    borderColor: "#242E40",
  },

  sendIcon: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "600",
    marginTop: -2,
  },

  disclaimer: {
    textAlign: "center",
    color: "#566176",
    fontSize: 10,
    paddingHorizontal: 20,
    paddingBottom: 3,
  },
});