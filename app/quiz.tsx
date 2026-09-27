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
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Question = {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
};

type QuizData = {
  topic: string;
  difficulty: string;
  questions: Question[];
};

export default function QuizScreen() {
  const router = useRouter();

  const [topic, setTopic] = useState("");
  const [numberOfQuestions, setNumberOfQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState("medium");

  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState<QuizData | null>(null);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  // =========================================
  // GENERATE QUIZ
  // =========================================

  const generateQuiz = async () => {
    if (!topic.trim()) {
      Alert.alert("Topic Required", "Please enter a topic to create a quiz.");
      return;
    }

    setLoading(true);
    setQuiz(null);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setScore(0);
    setShowResult(false);

    try {
      const response = await fetch("http://10.0.2.2:3000/generate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: topic.trim(),
          numberOfQuestions,
          difficulty,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate quiz.");
      }

      setQuiz(data);
    } catch (error) {
      console.error("Quiz error:", error);
      Alert.alert(
        "Quiz Error",
        "Could not connect to the AI server. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // SELECT ANSWER
  // =========================================

  const selectAnswer = (optionIndex: number) => {
    if (selectedAnswer !== null || !quiz) return;

    const question = quiz.questions[currentQuestion];
    if (!question) return;

    setSelectedAnswer(optionIndex);

    if (optionIndex === question.correctAnswer) {
      setScore((previousScore) => previousScore + 1);
    }
  };

  // =========================================
  // NEXT QUESTION
  // =========================================

  const nextQuestion = () => {
    if (!quiz) return;

    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion((previousQuestion) => previousQuestion + 1);
      setSelectedAnswer(null);
    } else {
      setShowResult(true);
    }
  };

  // =========================================
  // RESTART QUIZ
  // =========================================

  const restartQuiz = () => {
    setQuiz(null);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setScore(0);
    setShowResult(false);
  };

  const current = quiz?.questions[currentQuestion];

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
          <Text style={styles.headerTitle}>AI Quiz Challenge</Text>
          <Text style={styles.headerSubtitle}>Powered by StudyMate AI</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* =====================================
            QUIZ SETUP FORM
        ===================================== */}
        {!quiz && !loading && (
          <View style={styles.setupCard}>
            <View style={styles.heroGlowCircle}>
              <View style={styles.heroIconWrapper}>
                <Text style={styles.heroEmoji}>🎯</Text>
              </View>
            </View>

            <Text style={styles.title}>Create AI Quiz</Text>
            <Text style={styles.description}>
              Type any topic you want to master, and AI will construct custom practice questions for you!
            </Text>

            {/* TOPIC INPUT */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Quiz Topic</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Machine Learning, Ancient History..."
                placeholderTextColor="#64748B"
                value={topic}
                onChangeText={setTopic}
                autoCapitalize="sentences"
              />
            </View>

            {/* NUMBER OF QUESTIONS */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Number of Questions</Text>
              <View style={styles.optionsRow}>
                {[5, 10, 15].map((number) => {
                  const isActive = numberOfQuestions === number;
                  return (
                    <TouchableOpacity
                      key={number}
                      style={[
                        styles.chipButton,
                        isActive && styles.chipButtonActive,
                      ]}
                      onPress={() => setNumberOfQuestions(number)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isActive && styles.chipTextActive,
                        ]}
                      >
                        {number} Questions
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* DIFFICULTY */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Difficulty Level</Text>
              <View style={styles.optionsRow}>
                {["easy", "medium", "hard"].map((level) => {
                  const isActive = difficulty === level;
                  return (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.chipButton,
                        isActive && styles.chipButtonActive,
                      ]}
                      onPress={() => setDifficulty(level)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isActive && styles.chipTextActive,
                        ]}
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* GENERATE BUTTON */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={generateQuiz}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonIcon}>✨</Text>
              <Text style={styles.primaryButtonText}>Generate Quiz</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* =====================================
            LOADING STATE
        ===================================== */}
        {loading && (
          <View style={styles.loadingCard}>
            <View style={styles.loadingGlow}>
              <ActivityIndicator size="large" color="#8B5CF6" />
            </View>
            <Text style={styles.loadingTitle}>Generating Questions...</Text>
            <Text style={styles.loadingText}>
              StudyMate AI is designing questions for "{topic}". Please wait a moment...
            </Text>
          </View>
        )}

        {/* =====================================
            QUIZ QUESTIONS
        ===================================== */}
        {quiz && current && !showResult && (
          <View style={styles.quizWrapper}>
            {/* TOP BAR */}
            <View style={styles.quizTopHeader}>
              <View style={styles.counterBadge}>
                <Text style={styles.counterText}>
                  Question {currentQuestion + 1} of {quiz.questions.length}
                </Text>
              </View>

              <View style={styles.scoreBadge}>
                <Text style={styles.scoreText}>Score: {score}</Text>
              </View>
            </View>

            {/* PROGRESS BAR */}
            <View style={styles.progressBackground}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${
                      ((currentQuestion + 1) / quiz.questions.length) * 100
                    }%`,
                  },
                ]}
              />
            </View>

            {/* QUESTION CARD */}
            <View style={styles.questionCard}>
              <Text style={styles.questionText}>{current.question}</Text>
            </View>

            {/* OPTIONS */}
            <View style={styles.optionsList}>
              {current.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrect = current.correctAnswer === index;

                let optionStyle = styles.answerButton;
                let badgeStyle = styles.optionBadge;
                let badgeTextStyle = styles.optionLetter;

                if (selectedAnswer !== null) {
                  if (isCorrect) {
                    optionStyle = styles.correctAnswer;
                    badgeStyle = styles.correctBadge;
                    badgeTextStyle = styles.badgeTextWhite;
                  } else if (isSelected) {
                    optionStyle = styles.wrongAnswer;
                    badgeStyle = styles.wrongBadge;
                    badgeTextStyle = styles.badgeTextWhite;
                  }
                }

                return (
                  <TouchableOpacity
                    key={index}
                    style={optionStyle}
                    onPress={() => selectAnswer(index)}
                    disabled={selectedAnswer !== null}
                    activeOpacity={0.8}
                  >
                    <View style={badgeStyle}>
                      <Text style={badgeTextStyle}>
                        {String.fromCharCode(65 + index)}
                      </Text>
                    </View>

                    <Text style={styles.answerText}>{option}</Text>

                    {selectedAnswer !== null && isCorrect && (
                      <View style={styles.iconCircleCorrect}>
                        <Text style={styles.iconSymbol}>✓</Text>
                      </View>
                    )}

                    {selectedAnswer !== null && isSelected && !isCorrect && (
                      <View style={styles.iconCircleWrong}>
                        <Text style={styles.iconSymbol}>✕</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* EXPLANATION */}
            {selectedAnswer !== null && (
              <View style={styles.explanationCard}>
                <View style={styles.explanationHeader}>
                  <Text style={styles.explanationEmoji}>💡</Text>
                  <Text style={styles.explanationTitle}>Explanation</Text>
                </View>
                <Text style={styles.explanationText}>
                  {current.explanation}
                </Text>
              </View>
            )}

            {/* NEXT BUTTON */}
            {selectedAnswer !== null && (
              <TouchableOpacity
                style={styles.nextButton}
                onPress={nextQuestion}
                activeOpacity={0.85}
              >
                <Text style={styles.nextButtonText}>
                  {currentQuestion === quiz.questions.length - 1
                    ? "View Final Results"
                    : "Next Question"}
                </Text>
                <Text style={styles.nextArrow}>→</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* =====================================
            RESULT SCREEN
        ===================================== */}
        {showResult && quiz && (
          <View style={styles.resultCard}>
            <View style={styles.trophyWrapper}>
              <Text style={styles.trophyEmoji}>🏆</Text>
            </View>

            <Text style={styles.resultTitle}>Quiz Completed!</Text>
            <Text style={styles.resultSubtitle}>
              Great effort on testing your knowledge for "{quiz.topic}"
            </Text>

            <View style={styles.scoreContainer}>
              <Text style={styles.scoreLabel}>YOUR FINAL SCORE</Text>
              <Text style={styles.finalScore}>
                {score} <Text style={styles.totalQuestions}>/ {quiz.questions.length}</Text>
              </Text>

              <View style={styles.percentagePill}>
                <Text style={styles.percentageText}>
                  {Math.round((score / quiz.questions.length) * 100)}% Accuracy
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={restartQuiz}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonIcon}>🔄</Text>
              <Text style={styles.primaryButtonText}>Create New Quiz</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A", // Rich Deep Slate Dark Mode
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
    justifyContent: "center",
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
    paddingTop: 24,
    paddingBottom: 40,
  },

  // SETUP CARD
  setupCard: {
    backgroundColor: "#1E293B",
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: "#334155",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  heroGlowCircle: {
    alignSelf: "center",
    padding: 10,
    borderRadius: 40,
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    marginBottom: 16,
  },
  heroIconWrapper: {
    width: 68,
    height: 68,
    borderRadius: 24,
    backgroundColor: "#8B5CF6",
    alignItems: "center",
    justifyContent: "center",
  },
  heroEmoji: {
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
    marginBottom: 28,
  },
  inputGroup: {
    marginBottom: 22,
  },
  label: {
    fontSize: 12,
    fontWeight: "800",
    color: "#CBD5E1",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  input: {
    height: 54,
    backgroundColor: "#0F172A",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#334155",
    paddingHorizontal: 18,
    fontSize: 15,
    color: "#F8FAFC",
    fontWeight: "600",
  },
  optionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  chipButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#0F172A",
    borderWidth: 1.5,
    borderColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
  },
  chipButtonActive: {
    backgroundColor: "#8B5CF6",
    borderColor: "#A78BFA",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#94A3B8",
  },
  chipTextActive: {
    color: "#FFFFFF",
  },

  // PRIMARY BUTTON
  primaryButton: {
    height: 56,
    borderRadius: 18,
    backgroundColor: "#8B5CF6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  // LOADING CARD
  loadingCard: {
    backgroundColor: "#1E293B",
    borderRadius: 28,
    padding: 36,
    alignItems: "center",
    marginTop: 30,
    borderWidth: 1,
    borderColor: "#334155",
  },
  loadingGlow: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#F8FAFC",
  },
  loadingText: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 22,
  },

  // QUIZ WRAPPER
  quizWrapper: {
    flex: 1,
  },
  quizTopHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  counterBadge: {
    backgroundColor: "#334155",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  counterText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#F8FAFC",
  },
  scoreBadge: {
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#8B5CF6",
  },
  scoreText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#C4B5FD",
  },
  progressBackground: {
    height: 10,
    backgroundColor: "#334155",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 22,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#8B5CF6",
    borderRadius: 10,
  },
  questionCard: {
    backgroundColor: "#1E293B",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 18,
  },
  questionText: {
    fontSize: 19,
    fontWeight: "800",
    lineHeight: 28,
    color: "#F8FAFC",
  },
  optionsList: {
    gap: 12,
    marginBottom: 18,
  },
  answerButton: {
    minHeight: 62,
    backgroundColor: "#1E293B",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#334155",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  correctAnswer: {
    minHeight: 62,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#10B981",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  wrongAnswer: {
    minHeight: 62,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#EF4444",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  optionLetter: {
    fontSize: 14,
    fontWeight: "800",
    color: "#CBD5E1",
  },
  correctBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  wrongBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  badgeTextWhite: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  answerText: {
    flex: 1,
    fontSize: 15,
    color: "#F1F5F9",
    fontWeight: "600",
    lineHeight: 22,
  },
  iconCircleCorrect: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleWrong: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  iconSymbol: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  // EXPLANATION
  explanationCard: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#F59E0B",
    marginBottom: 18,
  },
  explanationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  explanationEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FBBF24",
  },
  explanationText: {
    fontSize: 13,
    color: "#FDE68A",
    lineHeight: 20,
    fontWeight: "500",
  },

  // NEXT BUTTON
  nextButton: {
    height: 56,
    borderRadius: 18,
    backgroundColor: "#8B5CF6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  nextArrow: {
    color: "#FFFFFF",
    fontSize: 20,
    marginLeft: 8,
  },

  // RESULT SCREEN
  resultCard: {
    backgroundColor: "#1E293B",
    borderRadius: 28,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  trophyWrapper: {
    width: 96,
    height: 96,
    borderRadius: 32,
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  trophyEmoji: {
    fontSize: 50,
  },
  resultTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#F8FAFC",
  },
  resultSubtitle: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 6,
  },
  scoreContainer: {
    width: "100%",
    backgroundColor: "#0F172A",
    borderRadius: 22,
    padding: 24,
    alignItems: "center",
    marginVertical: 26,
    borderWidth: 1,
    borderColor: "#334155",
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 1.5,
  },
  finalScore: {
    fontSize: 46,
    fontWeight: "900",
    color: "#A78BFA",
    marginTop: 4,
  },
  totalQuestions: {
    fontSize: 22,
    color: "#64748B",
    fontWeight: "700",
  },
  percentagePill: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#10B981",
  },
  percentageText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#34D399",
  },
});