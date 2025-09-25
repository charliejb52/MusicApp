import { supabase } from "@/lib/supabase";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type UserProfile = {
  id: string;
  email: string;
  user_type: "artist" | "venue";
  display_name: string;
  bio?: string;
  location?: string;
  profile_picture_url?: string;
  website?: string;
  phone?: string;
  social_links?: Record<string, string>;
};

type UserMedia = {
  id: string;
  media_type: "image" | "video" | "audio";
  media_url: string;
  caption?: string;
  created_at: string;
};

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [media, setMedia] = useState<UserMedia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
      fetchUserMedia();
    }
  }, [userId]);

  const fetchUserProfile = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        Alert.alert("Error", "Failed to load profile");
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserMedia = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from("user_media")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching user media:", error);
        return;
      }

      setMedia(data || []);
    } catch (error) {
      console.error("Error fetching user media:", error);
    }
  };

  const handleMessage = () => {
    if (!profile) return;

    router.push({
      pathname: "/chat",
      params: {
        otherUserId: profile.id,
        otherUserName: profile.display_name,
      },
    });
  };

  const handleContact = () => {
    if (!profile) return;

    const contactOptions = [];

    if (profile.phone) {
      contactOptions.push({
        text: "Call",
        onPress: () => Alert.alert("Call", profile.phone!),
      });
    }

    if (profile.email) {
      contactOptions.push({
        text: "Email",
        onPress: () => Alert.alert("Email", profile.email!),
      });
    }

    if (profile.website) {
      contactOptions.push({
        text: "Website",
        onPress: () => Alert.alert("Website", profile.website!),
      });
    }

    if (contactOptions.length === 0) {
      Alert.alert(
        "No Contact Info",
        "This user hasn't provided contact information."
      );
      return;
    }

    contactOptions.push({ text: "Cancel", style: "cancel" });

    Alert.alert(
      "Contact",
      "How would you like to contact this user?",
      contactOptions
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#111827" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Profile not found</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <View style={styles.backButtonContainer}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.profilePictureContainer}>
          {profile.profile_picture_url ? (
            <Image
              source={{ uri: profile.profile_picture_url }}
              style={styles.profilePicture}
            />
          ) : (
            <View style={styles.defaultProfilePicture}>
              <Text style={styles.profilePictureText}>
                {profile.display_name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.profileInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.displayName}>{profile.display_name}</Text>
            <View style={styles.userTypeBadge}>
              <Text style={styles.userTypeText}>
                {profile.user_type.toUpperCase()}
              </Text>
            </View>
          </View>

          {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

          {profile.location && (
            <Text style={styles.location}>📍 {profile.location}</Text>
          )}

          <View style={styles.contactInfo}>
            {profile.website && (
              <Text style={styles.contactItem}>🌐 {profile.website}</Text>
            )}
            {profile.phone && (
              <Text style={styles.contactItem}>📞 {profile.phone}</Text>
            )}
          </View>

          <View style={styles.actionButtons}>
            <Pressable
              style={styles.messageButton}
              onPress={() => handleMessage()}
            >
              <Text style={styles.messageButtonText}>Message</Text>
            </Pressable>
            <Pressable style={styles.contactButton} onPress={handleContact}>
              <Text style={styles.contactButtonText}>Contact</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Media Section */}
      <View style={styles.mediaSection}>
        <Text style={styles.sectionTitle}>Media</Text>
        {media.length === 0 ? (
          <View style={styles.emptyMediaContainer}>
            <Text style={styles.emptyMediaText}>No media shared yet</Text>
          </View>
        ) : (
          <View style={styles.mediaGrid}>
            {media.map((item) => (
              <View key={item.id} style={styles.mediaItem}>
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
                {item.caption && (
                  <Text style={styles.mediaCaption} numberOfLines={2}>
                    {item.caption}
                  </Text>
                )}
              </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#ef4444",
    marginBottom: 20,
  },
  header: {
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: {
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
  profileSection: {
    backgroundColor: "white",
    padding: 20,
    marginBottom: 8,
  },
  profilePictureContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  defaultProfilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  profilePictureText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#6b7280",
  },
  profileInfo: {
    alignItems: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  displayName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginRight: 12,
  },
  userTypeBadge: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  userTypeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  bio: {
    fontSize: 16,
    color: "#374151",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 12,
  },
  location: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 16,
  },
  contactInfo: {
    marginBottom: 20,
  },
  contactItem: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  messageButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
  },
  messageButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  contactButton: {
    backgroundColor: "#111827",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
  },
  contactButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  mediaSection: {
    backgroundColor: "white",
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  emptyMediaContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyMediaText: {
    fontSize: 16,
    color: "#6b7280",
  },
  mediaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  mediaItem: {
    width: "48%",
    aspectRatio: 1,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
  },
  mediaThumbnail: {
    width: "100%",
    height: "100%",
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
  mediaCaption: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    color: "white",
    fontSize: 12,
    padding: 8,
    textAlign: "center",
  },
});
