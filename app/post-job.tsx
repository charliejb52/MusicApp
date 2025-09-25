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

export default function PostJobScreen() {
  const { user, profile } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [payRange, setPayRange] = useState("");
  const [requirements, setRequirements] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user || profile?.user_type !== "venue") {
      Alert.alert("Error", "Only venues can post jobs");
      return;
    }

    if (
      !title.trim() ||
      !description.trim() ||
      !genre.trim() ||
      !eventDate.trim() ||
      !location.trim()
    ) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("jobs").insert({
        venue_id: user.id,
        title: title.trim(),
        description: description.trim(),
        genre: genre.trim(),
        event_date: eventDate,
        pay_range: payRange.trim() || null,
        requirements: requirements.trim() || null,
        contact_info: contactInfo.trim() || null,
        location: location.trim(),
      });

      if (error) {
        Alert.alert("Error", "Failed to post job");
        console.error("Error posting job:", error);
      } else {
        Alert.alert("Success", "Job posted successfully!");
        router.back();
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong");
      console.error("Error posting job:", error);
    } finally {
      setLoading(false);
    }
  };

  if (profile?.user_type !== "venue") {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Only venues can post jobs. Please sign in as a venue account.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Post a Job</Text>
      </View>

      <View style={styles.backButtonContainer}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
      </View>

      <View style={styles.form}>
        <Text style={styles.sectionTitle}>Job Details</Text>

        <Text style={styles.label}>Job Title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g., Live Music Performance"
        />

        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the gig, what you're looking for, etc."
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Genre *</Text>
        <TextInput
          style={styles.input}
          value={genre}
          onChangeText={setGenre}
          placeholder="e.g., Rock, Jazz, Electronic, etc."
        />

        <Text style={styles.label}>Event Date *</Text>
        <TextInput
          style={styles.input}
          value={eventDate}
          onChangeText={setEventDate}
          placeholder="YYYY-MM-DD (e.g., 2024-03-15)"
        />

        <Text style={styles.label}>Location *</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="e.g., Durham, NC"
        />

        <Text style={styles.sectionTitle}>Additional Information</Text>

        <Text style={styles.label}>Pay Range</Text>
        <TextInput
          style={styles.input}
          value={payRange}
          onChangeText={setPayRange}
          placeholder="e.g., $200-500, Negotiable, etc."
        />

        <Text style={styles.label}>Requirements</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={requirements}
          onChangeText={setRequirements}
          placeholder="Equipment needed, experience level, etc."
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>Contact Information</Text>
        <TextInput
          style={styles.input}
          value={contactInfo}
          onChangeText={setContactInfo}
          placeholder="Email, phone, or preferred contact method"
        />

        <Pressable
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? "Posting..." : "Post Job"}
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
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
    marginTop: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "white",
    fontSize: 16,
    marginBottom: 4,
  },
  textArea: {
    textAlignVertical: "top",
    minHeight: 80,
  },
  submitButton: {
    backgroundColor: "#111827",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 24,
  },
  submitButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: "#ef4444",
    padding: 20,
  },
});
