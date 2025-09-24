import MediaUpload from "@/components/MediaUpload";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type UserMedia = {
  id: string;
  media_type: "image" | "video" | "audio";
  media_url: string;
  caption?: string;
  created_at: string;
};

export default function ProfileScreen() {
  const { user, profile, updateProfile, signOut } = useAuth();
  const [bio, setBio] = useState(profile?.bio || "");
  const [location, setLocation] = useState(profile?.location || "");
  const [media, setMedia] = useState<UserMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (profile) {
      setBio(profile.bio || "");
      setLocation(profile.location || "");
    }
    fetchMedia();
  }, [profile]);

  const fetchMedia = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_media")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching media:", error);
      } else {
        setMedia(data || []);
      }
    } catch (error) {
      console.error("Error fetching media:", error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await updateProfile({
        bio: bio.trim(),
        location: location.trim(),
      });

      if (error) {
        Alert.alert("Error", "Failed to update profile");
      } else {
        Alert.alert("Success", "Profile updated successfully");
        setEditing(false);
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace("/auth/login");
  };

  if (!user || !profile) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Profile</Text>
        <Pressable onPress={handleSignOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.profilePictureContainer}>
          <Image
            source={{
              uri:
                profile.profile_picture_url ||
                "https://via.placeholder.com/120",
            }}
            style={styles.profilePicture}
          />
          <Pressable style={styles.editPictureButton}>
            <Text style={styles.editPictureText}>📷</Text>
          </Pressable>
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.displayName}>{profile.display_name}</Text>
          <Text style={styles.userType}>
            {profile.user_type === "artist" ? "🎵 Artist" : "🏢 Venue"}
          </Text>
          <Text style={styles.email}>{profile.email}</Text>
        </View>

        <Pressable
          style={styles.editButton}
          onPress={() => setEditing(!editing)}
        >
          <Text style={styles.editButtonText}>
            {editing ? "Cancel" : "Edit Profile"}
          </Text>
        </Pressable>
      </View>

      {editing && (
        <View style={styles.editSection}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <TextInput
            style={styles.bioInput}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself..."
            multiline
            numberOfLines={4}
          />

          <Text style={styles.sectionTitle}>Location</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="City, State"
          />

          <Pressable
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSaveProfile}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? "Saving..." : "Save Changes"}
            </Text>
          </Pressable>
        </View>
      )}

      <View style={styles.mediaSection}>
        <View style={styles.mediaHeader}>
          <Text style={styles.sectionTitle}>Media</Text>
          <MediaUpload onUploadComplete={fetchMedia} />
        </View>

        {media.length === 0 ? (
          <View style={styles.emptyMedia}>
            <Text style={styles.emptyMediaText}>No media yet</Text>
            <Text style={styles.emptyMediaSubtext}>
              Share photos, videos, or audio from your performances
            </Text>
          </View>
        ) : (
          <View style={styles.mediaGrid}>
            {media.map((item) => (
              <TouchableOpacity key={item.id} style={styles.mediaItem}>
                <Image
                  source={{ uri: item.media_url }}
                  style={styles.mediaThumbnail}
                />
                <View style={styles.mediaOverlay}>
                  <Text style={styles.mediaType}>
                    {item.media_type === "image"
                      ? "📷"
                      : item.media_type === "video"
                      ? "🎥"
                      : "🎵"}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: "#111827",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  signOutButton: {
    padding: 8,
    backgroundColor: "#ef4444",
    borderRadius: 6,
  },
  signOutText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  profileSection: {
    backgroundColor: "white",
    padding: 20,
    alignItems: "center",
  },
  profilePictureContainer: {
    position: "relative",
    marginBottom: 16,
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#e5e7eb",
  },
  editPictureButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#111827",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  editPictureText: {
    fontSize: 16,
  },
  profileInfo: {
    alignItems: "center",
    marginBottom: 16,
  },
  displayName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  userType: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: "#9ca3af",
  },
  editButton: {
    backgroundColor: "#111827",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  editButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  editSection: {
    backgroundColor: "white",
    padding: 20,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  bioInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "white",
    fontSize: 16,
    marginBottom: 16,
    textAlignVertical: "top",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "white",
    fontSize: 16,
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: "#111827",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  mediaSection: {
    backgroundColor: "white",
    padding: 20,
    marginTop: 8,
  },
  mediaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  addMediaButton: {
    backgroundColor: "#111827",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addMediaText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  emptyMedia: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyMediaText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#6b7280",
    marginBottom: 8,
  },
  emptyMediaSubtext: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
  },
  mediaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  mediaItem: {
    width: "30%",
    aspectRatio: 1,
    position: "relative",
  },
  mediaThumbnail: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    backgroundColor: "#e5e7eb",
  },
  mediaOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mediaType: {
    color: "white",
    fontSize: 12,
  },
});
