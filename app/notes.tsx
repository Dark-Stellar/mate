import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebaseConfig";
import {
  Alert,
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

type Note = {
  id: string;
  title: string;
  content: string;
};

export default function NotesScreen() {
  const router = useRouter();

  const [notes, setNotes] = useState<Note[]>([]);
  const [searchText, setSearchText] = useState("");

  const [showEditor, setShowEditor] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [loadingNotes, setLoadingNotes] = useState(true);
  const [userId, setUserId] = useState<string>("guest_user");

  // ==========================================
  // RE-LOAD NOTES EVERY TIME SCREEN IS FOCUSED
  // ==========================================
  useFocusEffect(
    useCallback(() => {
      initNotes();

      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        if (currentUser) {
          const activeUserId = currentUser.uid;
          setUserId(activeUserId);
          loadNotesForUser(activeUserId);
        } else {
          setUserId("");
          setNotes([]);
        }
      });

      return unsubscribe;
    }, [])
  );

  const initNotes = async () => {
    try {
      setLoadingNotes(true);

      // Use Firebase UID so every account has completely separate notes.
      const currentUser = auth.currentUser;

      if (currentUser) {
        const activeUserId = currentUser.uid;
        setUserId(activeUserId);
        await loadNotesForUser(activeUserId);
      } else {
        // No logged-in user: never show another account's notes.
        setUserId("");
        setNotes([]);
      }
    } catch (error) {
      console.error("User init error:", error);
      setUserId("");
      setNotes([]);
    } finally {
      setLoadingNotes(false);
    }
  };

  const loadNotesForUser = async (currentUserId: string) => {
    try {
      const storageKey = `@studymate_notes_${currentUserId}`;
      const savedNotes = await AsyncStorage.getItem(storageKey);

      if (savedNotes) {
        setNotes(JSON.parse(savedNotes));
      } else {
        setNotes([]);
      }
    } catch (error) {
      console.error("Load notes error:", error);
      Alert.alert("Error", "Could not load your notes.");
    }
  };

  const saveNotesToStorage = async (
    updatedNotes: Note[],
    currentUserId: string
  ) => {
    try {
      const storageKey = `@studymate_notes_${currentUserId}`;
      await AsyncStorage.setItem(
        storageKey,
        JSON.stringify(updatedNotes)
      );
    } catch (error) {
      console.error("Save notes error:", error);
      Alert.alert("Error", "Could not save your notes.");
    }
  };

  const saveNote = async () => {
    const activeUserId = userId || "guest_user";
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle) {
      Alert.alert("Title Required", "Please enter a title.");
      return;
    }

    if (!trimmedContent) {
      Alert.alert("Content Required", "Please write something in your note.");
      return;
    }

    let updatedNotes: Note[];

    if (editingNoteId) {
      updatedNotes = notes.map((note) =>
        note.id === editingNoteId
          ? {
              ...note,
              title: trimmedTitle,
              content: trimmedContent,
            }
          : note
      );
    } else {
      const newNote: Note = {
        id: Date.now().toString(),
        title: trimmedTitle,
        content: trimmedContent,
      };

      updatedNotes = [newNote, ...notes];
    }

    setNotes(updatedNotes);
    await saveNotesToStorage(updatedNotes, activeUserId);

    setTitle("");
    setContent("");
    setEditingNoteId(null);
    setShowEditor(false);

    Alert.alert(
      editingNoteId ? "Note Updated" : "Note Saved",
      editingNoteId
        ? "Your note has been updated."
        : "Your note has been saved successfully."
    );
  };

  const editNote = (note: Note) => {
    setTitle(note.title);
    setContent(note.content);
    setEditingNoteId(note.id);
    setShowEditor(true);
  };

  const deleteNote = (id: string) => {
    Alert.alert(
      "Delete Note",
      "Are you sure you want to delete this note?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const activeUserId = userId || "guest_user";
            const updatedNotes = notes.filter((note) => note.id !== id);

            setNotes(updatedNotes);
            await saveNotesToStorage(updatedNotes, activeUserId);
          },
        },
      ]
    );
  };

  const cancelEditor = () => {
    setTitle("");
    setContent("");
    setEditingNoteId(null);
    setShowEditor(false);
  };

  const filteredNotes = notes.filter((note) => {
    const search = searchText.toLowerCase();

    return (
      note.title.toLowerCase().includes(search) ||
      note.content.toLowerCase().includes(search)
    );
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>

          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>My Notes</Text>
            <Text style={styles.headerSubtitle}>
              Keep your study notes organized
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setTitle("");
              setContent("");
              setEditingNoteId(null);
              setShowEditor(true);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.addIcon}>+</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>

            <TextInput
              style={styles.searchInput}
              placeholder="Search your notes..."
              placeholderTextColor="#64748B"
              value={searchText}
              onChangeText={setSearchText}
            />

            {searchText.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchText("")}
                activeOpacity={0.7}
              >
                <Text style={styles.clearSearch}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {showEditor && (
            <View style={styles.editorCard}>
              <Text style={styles.editorTitle}>
                {editingNoteId ? "Edit Note" : "Create New Note"}
              </Text>

              <TextInput
                style={styles.titleInput}
                placeholder="Note title"
                placeholderTextColor="#64748B"
                value={title}
                onChangeText={setTitle}
              />

              <TextInput
                style={styles.contentInput}
                placeholder="Write your note here..."
                placeholderTextColor="#64748B"
                value={content}
                onChangeText={setContent}
                multiline
                textAlignVertical="top"
              />

              <View style={styles.editorButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={cancelEditor}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={saveNote}
                  activeOpacity={0.85}
                >
                  <Text style={styles.saveText}>
                    💾 {editingNoteId ? "Update" : "Save"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {loadingNotes ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>⏳</Text>
              <Text style={styles.emptyTitle}>Loading Notes...</Text>
            </View>
          ) : (
            <>
              {notes.length === 0 && !showEditor && (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconContainer}>
                    <Text style={styles.emptyIcon}>📚</Text>
                  </View>

                  <Text style={styles.emptyTitle}>No Notes Yet</Text>

                  <Text style={styles.emptyDescription}>
                    Create your first study note and keep all your
                    important information in one place.
                  </Text>

                  <TouchableOpacity
                    style={styles.createButton}
                    onPress={() => setShowEditor(true)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.createButtonText}>
                      + Create First Note
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {notes.length > 0 && filteredNotes.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>🔍</Text>
                  <Text style={styles.emptyTitle}>No Notes Found</Text>
                  <Text style={styles.emptyDescription}>
                    Try searching with another keyword.
                  </Text>
                </View>
              )}

              {filteredNotes.length > 0 && (
                <View>
                  <View style={styles.notesHeader}>
                    <Text style={styles.sectionTitle}>Your Notes</Text>
                    <Text style={styles.noteCount}>
                      {filteredNotes.length}{" "}
                      {filteredNotes.length === 1 ? "note" : "notes"}
                    </Text>
                  </View>

                  {filteredNotes.map((note) => (
                    <View key={note.id} style={styles.noteCard}>
                      <View style={styles.noteIconContainer}>
                        <Text style={styles.noteIcon}>📝</Text>
                      </View>

                      <View style={styles.noteContent}>
                        <Text style={styles.noteTitle} numberOfLines={1}>
                          {note.title}
                        </Text>

                        <Text style={styles.noteText} numberOfLines={3}>
                          {note.content}
                        </Text>
                      </View>

                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          style={styles.editButton}
                          onPress={() => editNote(note)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.actionIcon}>✏️</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => deleteNote(note.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.actionIcon}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          <View style={styles.infoCard}>
            <Text style={styles.infoEmoji}>💡</Text>

            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Study Tip</Text>
              <Text style={styles.infoText}>
                Write short and clear notes to make revision easier.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  keyboardContainer: {
    flex: 1,
  },
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#8B5CF6",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addIcon: {
    fontSize: 26,
    color: "#FFFFFF",
    fontWeight: "600",
    marginTop: -2,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  searchContainer: {
    height: 52,
    backgroundColor: "#1E293B",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#F8FAFC",
  },
  clearSearch: {
    fontSize: 16,
    color: "#94A3B8",
    paddingLeft: 8,
  },
  editorCard: {
    backgroundColor: "#1E293B",
    borderRadius: 20,
    padding: 20,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: "#334155",
  },
  editorTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#F8FAFC",
    marginBottom: 16,
  },
  titleInput: {
    height: 50,
    backgroundColor: "#0F172A",
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 14,
    color: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 12,
  },
  contentInput: {
    height: 140,
    backgroundColor: "#0F172A",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    lineHeight: 22,
    color: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#334155",
  },
  editorButtons: {
    flexDirection: "row",
    marginTop: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "700",
  },
  saveButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#8B5CF6",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  emptyContainer: {
    backgroundColor: "#1E293B",
    borderRadius: 22,
    paddingHorizontal: 24,
    paddingVertical: 36,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#F8FAFC",
    marginTop: 4,
  },
  emptyDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 22,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  notesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#F8FAFC",
  },
  noteCount: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8B5CF6",
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  noteCard: {
    backgroundColor: "#1E293B",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  noteIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  noteIcon: {
    fontSize: 22,
  },
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#F8FAFC",
    marginBottom: 4,
  },
  noteText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#94A3B8",
  },
  actionButtons: {
    marginLeft: 10,
    gap: 8,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionIcon: {
    fontSize: 15,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    borderRadius: 18,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  infoEmoji: {
    fontSize: 26,
  },
  infoContent: {
    flex: 1,
    marginLeft: 14,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#F59E0B",
    marginBottom: 3,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#CBD5E1",
  },
});