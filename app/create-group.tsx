import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const COMMON_ROLES = [
  "Guitarist",
  "Singer",
  "Drummer",
  "Bassist",
  "Keyboardist",
  "Saxophonist",
  "Violinist",
  "Trumpeter",
  "Pianist",
  "Producer",
  "Songwriter",
  "Other",
];

const COMMON_GENRES = [
  "Rock",
  "Pop",
  "Jazz",
  "Blues",
  "Country",
  "Hip-Hop",
  "Electronic",
  "Classical",
  "Folk",
  "R&B",
  "Reggae",
  "Other",
];

export default function CreateGroupScreen() {
  const { user, profile } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [customGenre, setCustomGenre] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user || !profile) {
      Alert.alert("Error", "You must be logged in to create a group");
      return;
    }

    if (profile.user_type !== "artist") {
      Alert.alert("Error", "Only artists can create groups");
      return;
    }

    if (!name.trim()) {
      Alert.alert("Error", "Please enter a group name");
      return;
    }

    setLoading(true);
    try {
      const finalGenre = genre === "Other" ? customGenre.trim() : genre;

      const { data, error } = await supabase
        .from("groups")
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          genre: finalGenre || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating group:", error);
        Alert.alert("Error", `Failed to create group: ${error.message}`);
        return;
      }

      // Add the creator as a member with their role
      const { error: memberError } = await supabase
        .from("group_members")
        .insert({
          group_id: data.id,
          user_id: user.id,
          role: profile.role || "Creator",
        });

      if (memberError) {
        console.error("Error adding creator as member:", memberError);
        Alert.alert(
          "Warning",
          `Group created but failed to add you as member: ${memberError.message}`
        );
        // Don't fail the whole operation for this
      }

      Alert.alert("Success", "Group created successfully!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("Error creating group:", error);
      Alert.alert("Error", "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create New Group</Text>
      </View>

      <View style={styles.backButtonContainer}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
      </View>

      <View style={styles.form}>
        <Text style={styles.sectionTitle}>Group Details</Text>

        <Text style={styles.label}>Group Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g., The Midnight Players"
          autoCapitalize="words"
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Tell us about your group..."
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Genre</Text>
        <View style={styles.genreContainer}>
          {COMMON_GENRES.map((g) => (
            <Pressable
              key={g}
              style={[
                styles.genreButton,
                genre === g && styles.genreButtonSelected,
              ]}
              onPress={() => setGenre(g)}
            >
              <Text
                style={[
                  styles.genreButtonText,
                  genre === g && styles.genreButtonTextSelected,
                ]}
              >
                {g}
              </Text>
            </Pressable>
          ))}
        </View>

        {genre === "Other" && (
          <TextInput
            style={styles.input}
            value={customGenre}
            onChangeText={setCustomGenre}
            placeholder="Enter custom genre"
            autoCapitalize="words"
          />
        )}

        <Text style={styles.note}>
          * You will be automatically added as a member with your role:{" "}
          {profile?.role || "Not specified"}
        </Text>
      </View>

      <View style={styles.submitContainer}>
        <Pressable
          style={[styles.submit, loading && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitText}>
            {loading ? "Creating..." : "Create Group"}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  backButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backButton: {
    alignSelf: "flex-start",
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: "#111827",
  },
  form: {
    padding: 20,
    backgroundColor: "white",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "white",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  genreContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  genreButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "white",
  },
  genreButtonSelected: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },
  genreButtonText: {
    fontSize: 14,
    color: "#374151",
  },
  genreButtonTextSelected: {
    color: "white",
  },
  note: {
    fontSize: 14,
    color: "#6b7280",
    fontStyle: "italic",
    marginTop: 8,
  },
  submitContainer: {
    padding: 20,
    backgroundColor: "white",
  },
  submit: {
    backgroundColor: "#111827",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  submitDisabled: {
    backgroundColor: "#9ca3af",
  },
  submitText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
