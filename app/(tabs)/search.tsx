import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

export default function SearchScreen() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filter, setFilter] = useState<"all" | "artists" | "venues">("all");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (searchQuery.trim()) {
      searchUsers();
    } else {
      setUsers([]);
    }
  }, [searchQuery, filter]);

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      let query = supabase
        .from("user_profiles")
        .select("*")
        .neq("id", user?.id) // Exclude current user
        .or(
          `display_name.ilike.%${searchQuery}%,bio.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`
        );

      // Apply filter
      if (filter === "artists") {
        query = query.eq("user_type", "artist");
      } else if (filter === "venues") {
        query = query.eq("user_type", "venue");
      }

      const { data, error } = await query.limit(20);

      if (error) {
        console.error("Error searching users:", error);
        Alert.alert("Error", "Failed to search users");
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error("Error searching users:", error);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (searchQuery.trim()) {
      await searchUsers();
    }
    setRefreshing(false);
  };

  const handleUserPress = (profile: UserProfile) => {
    router.push({
      pathname: "/user-profile",
      params: { userId: profile.id },
    });
  };

  const getFilterButtonStyle = (filterType: "all" | "artists" | "venues") => ({
    ...styles.filterButton,
    backgroundColor: filter === filterType ? "#111827" : "#f3f4f6",
  });

  const getFilterTextStyle = (filterType: "all" | "artists" | "venues") => ({
    ...styles.filterButtonText,
    color: filter === filterType ? "white" : "#374151",
  });

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Discover People</Text>
      </View>

      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, bio, or location..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Filter by type:</Text>
        <View style={styles.filterButtons}>
          <Pressable
            style={getFilterButtonStyle("all")}
            onPress={() => setFilter("all")}
          >
            <Text style={getFilterTextStyle("all")}>All</Text>
          </Pressable>
          <Pressable
            style={getFilterButtonStyle("artists")}
            onPress={() => setFilter("artists")}
          >
            <Text style={getFilterTextStyle("artists")}>Artists</Text>
          </Pressable>
          <Pressable
            style={getFilterButtonStyle("venues")}
            onPress={() => setFilter("venues")}
          >
            <Text style={getFilterTextStyle("venues")}>Venues</Text>
          </Pressable>
        </View>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )}

      {!loading && searchQuery.trim() && users.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No results found</Text>
          <Text style={styles.emptySubtitle}>
            Try a different search term or adjust your filters
          </Text>
        </View>
      )}

      {!loading && !searchQuery.trim() && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Start searching</Text>
          <Text style={styles.emptySubtitle}>
            Enter a name, bio, or location to discover people
          </Text>
        </View>
      )}

      {users.length > 0 && (
        <View style={styles.resultsList}>
          {users.map((profile) => (
            <Pressable
              key={profile.id}
              style={styles.userCard}
              onPress={() => handleUserPress(profile)}
            >
              <View style={styles.userInfo}>
                <View style={styles.avatarContainer}>
                  {profile.profile_picture_url ? (
                    <Image
                      source={{ uri: profile.profile_picture_url }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View style={styles.defaultAvatar}>
                      <Text style={styles.avatarText}>
                        {profile.display_name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.userDetails}>
                  <View style={styles.userHeader}>
                    <Text style={styles.userName}>{profile.display_name}</Text>
                    <View style={styles.userTypeBadge}>
                      <Text style={styles.userTypeText}>
                        {profile.user_type.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  {profile.bio && (
                    <Text style={styles.userBio} numberOfLines={2}>
                      {profile.bio}
                    </Text>
                  )}
                  {profile.location && (
                    <Text style={styles.userLocation}>
                      📍 {profile.location}
                    </Text>
                  )}
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
  },
  searchSection: {
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "white",
    fontSize: 16,
  },
  filterSection: {
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: "row",
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#9ca3af",
    textAlign: "center",
  },
  resultsList: {
    padding: 16,
    gap: 12,
  },
  userCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  defaultAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#6b7280",
  },
  userDetails: {
    flex: 1,
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    flex: 1,
    marginRight: 8,
  },
  userTypeBadge: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  userTypeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  userBio: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
    marginBottom: 4,
  },
  userLocation: {
    fontSize: 14,
    color: "#6b7280",
  },
});
