import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Group = {
  id: string;
  name: string;
  description?: string;
  genre?: string;
  created_by: string;
  created_at: string;
  members: {
    id: string;
    user_id: string;
    role: string;
    user: {
      display_name: string;
      profile_picture_url?: string;
    };
  }[];
};

export default function GroupsScreen() {
  const { profile, user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (profile?.user_type === "artist") {
      fetchGroups();
    }
  }, [profile]);

  const fetchGroups = async () => {
    if (!user) {
      console.log("No user found, cannot fetch groups");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    console.log("Fetching groups for user:", user.id);

    try {
      // First get groups created by the user
      console.log("Fetching created groups...");
      const { data: createdGroups, error: createdError } = await supabase
        .from("groups")
        .select(
          `
          *,
          members:group_members(
            id,
            user_id,
            role
          )
        `
        )
        .eq("created_by", user.id);

      if (createdError) {
        console.error("Error fetching created groups:", createdError);
        Alert.alert(
          "Error",
          `Failed to fetch created groups: ${createdError.message}`
        );
        return;
      }

      console.log("Created groups:", createdGroups);

      // Then get groups where user is a member
      console.log("Fetching member groups...");
      const { data: memberGroups, error: memberError } = await supabase
        .from("group_members")
        .select(
          `
          group:groups(
            *,
            members:group_members(
              id,
              user_id,
              role
            )
          )
        `
        )
        .eq("user_id", user.id);

      if (memberError) {
        console.error("Error fetching member groups:", memberError);
        Alert.alert(
          "Error",
          `Failed to fetch member groups: ${memberError.message}`
        );
        return;
      }

      console.log("Member groups:", memberGroups);

      // Combine and deduplicate groups
      const allGroups = [
        ...(createdGroups || []),
        ...(memberGroups?.map((m) => m.group).filter(Boolean) || []),
      ];

      // Remove duplicates based on group id
      const uniqueGroups = allGroups.filter(
        (group, index, self) =>
          index === self.findIndex((g) => g.id === group.id)
      );

      console.log("Final groups:", uniqueGroups);
      setGroups(uniqueGroups);
    } catch (error) {
      console.error("Error fetching groups:", error);
      Alert.alert("Error", `Failed to fetch groups: ${error.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchGroups();
  };

  const handleCreateGroup = () => {
    router.push("/create-group");
  };

  const handleGroupPress = (groupId: string) => {
    router.push(`/group-details/${groupId}`);
  };

  if (profile?.user_type !== "artist") {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Groups</Text>
        </View>
        <View style={styles.restrictedContainer}>
          <Text style={styles.restrictedText}>
            Groups are only available for artists
          </Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Groups</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#111827" />
          <Text style={styles.loadingText}>Loading groups...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>My Groups</Text>
      </View>

      <View style={styles.createGroupContainer}>
        <Pressable style={styles.createGroupButton} onPress={handleCreateGroup}>
          <Text style={styles.createGroupText}>+ Create New Group</Text>
        </Pressable>
      </View>

      {groups.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No groups yet</Text>
          <Text style={styles.emptySubtitle}>
            Create your first group to start collaborating with other artists
          </Text>
        </View>
      ) : (
        <View style={styles.groupsList}>
          {groups.map((group) => (
            <Pressable
              key={group.id}
              style={styles.groupCard}
              onPress={() => handleGroupPress(group.id)}
            >
              <View style={styles.groupHeader}>
                <Text style={styles.groupName}>{group.name}</Text>
                {group.genre && (
                  <Text style={styles.groupGenre}>{group.genre}</Text>
                )}
              </View>

              {group.description && (
                <Text style={styles.groupDescription} numberOfLines={2}>
                  {group.description}
                </Text>
              )}

              <View style={styles.membersSection}>
                <Text style={styles.membersTitle}>
                  Members ({group.members?.length || 0})
                </Text>
                <View style={styles.membersList}>
                  {(group.members || []).slice(0, 3).map((member) => (
                    <View key={member.id} style={styles.memberItem}>
                      <View style={styles.defaultAvatar}>
                        <Text style={styles.avatarText}>
                          {member.role.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>{member.role}</Text>
                        <Text style={styles.memberRole}>Member</Text>
                      </View>
                    </View>
                  ))}
                  {(group.members?.length || 0) > 3 && (
                    <Text style={styles.moreMembers}>
                      +{(group.members?.length || 0) - 3} more
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
  createGroupContainer: {
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  createGroupButton: {
    backgroundColor: "#111827",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  createGroupText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#6b7280",
  },
  restrictedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  restrictedText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
  },
  groupsList: {
    padding: 16,
  },
  groupCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  groupHeader: {
    marginBottom: 8,
  },
  groupName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  groupGenre: {
    fontSize: 14,
    color: "#6b7280",
    fontStyle: "italic",
  },
  groupDescription: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
    marginBottom: 12,
  },
  membersSection: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 12,
  },
  membersTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  membersList: {
    gap: 8,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  defaultAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  memberRole: {
    fontSize: 12,
    color: "#6b7280",
  },
  moreMembers: {
    fontSize: 12,
    color: "#6b7280",
    fontStyle: "italic",
    marginLeft: 40,
  },
});
