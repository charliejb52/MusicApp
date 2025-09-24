import * as Location from "expo-location";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

export default function ModalScreen() {
  const [name, setName] = useState("");
  const [genre, setGenre] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, profile, signOut } = useAuth();

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        try {
          const loc = await Location.getCurrentPositionAsync({});
          setCoords({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        } catch {}
      }
    })();
  }, []);

  const onSubmit = async () => {
    if (!user) {
      Alert.alert("Authentication Required", "Please sign in to add venues.");
      router.replace("/auth/login");
      return;
    }

    if (!name.trim()) {
      Alert.alert("Error", "Please enter a venue name");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("venues")
        .insert({
          name: name.trim(),
          genre: genre.trim() || "Unknown",
          address: address.trim() || "Unspecified",
          latitude: coords?.latitude ?? 35.9992,
          longitude: coords?.longitude ?? -78.9083,
          owner_id: user.id,
        })
        .select()
        .single();

      if (error) {
        Alert.alert("Error", "Failed to add venue. Please try again.");
        console.error("Error adding venue:", error);
      } else {
        Alert.alert("Success", "Venue added successfully!");
        router.replace("/(tabs)/explore");
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong. Please try again.");
      console.error("Error adding venue:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace("/auth/login");
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Add Venue
      </ThemedText>

      {user && profile && (
        <View style={styles.userInfo}>
          <Text style={styles.userInfoText}>
            Signed in as {profile.display_name} ({profile.user_type})
          </Text>
          <Pressable onPress={handleSignOut} style={styles.signOutButton}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.formRow}>
        <TextInput
          placeholder="Venue name"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
      </View>
      <View style={styles.formRow}>
        <TextInput
          placeholder="Genre"
          value={genre}
          onChangeText={setGenre}
          style={styles.input}
        />
      </View>
      <View style={styles.formRow}>
        <TextInput
          placeholder="Address (optional)"
          value={address}
          onChangeText={setAddress}
          style={styles.input}
        />
      </View>
      <Pressable
        style={[styles.submit, loading && styles.submitDisabled]}
        onPress={onSubmit}
        disabled={loading}
        accessibilityLabel="Save venue"
      >
        <Text style={styles.submitText}>
          {loading ? "Adding Venue..." : "Save"}
        </Text>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  title: {
    marginBottom: 8,
  },
  userInfo: {
    backgroundColor: "#f3f4f6",
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfoText: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
  },
  signOutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#ef4444",
    borderRadius: 6,
  },
  signOutText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  formRow: {
    width: "100%",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "white",
  },
  submit: {
    marginTop: 12,
    backgroundColor: "#111827",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  submitDisabled: {
    backgroundColor: "#9ca3af",
  },
  submitText: {
    color: "white",
    fontWeight: "600",
  },
});
