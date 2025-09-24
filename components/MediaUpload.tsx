import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type MediaUploadProps = {
  onUploadComplete: () => void;
};

export default function MediaUpload({ onUploadComplete }: MediaUploadProps) {
  const [showModal, setShowModal] = useState(false);
  const [mediaType, setMediaType] = useState<"image" | "video" | "audio">(
    "image"
  );
  const [mediaUrl, setMediaUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();

  const handleUpload = async () => {
    if (!user) {
      Alert.alert("Error", "Please sign in to upload media");
      return;
    }

    if (!mediaUrl.trim()) {
      Alert.alert("Error", "Please enter a media URL");
      return;
    }

    setUploading(true);
    try {
      const { error } = await supabase.from("user_media").insert({
        user_id: user.id,
        media_type: mediaType,
        media_url: mediaUrl.trim(),
        caption: caption.trim() || null,
      });

      if (error) {
        Alert.alert("Error", "Failed to upload media");
        console.error("Error uploading media:", error);
      } else {
        Alert.alert("Success", "Media uploaded successfully!");
        setShowModal(false);
        setMediaUrl("");
        setCaption("");
        onUploadComplete();
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong");
      console.error("Error uploading media:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Pressable style={styles.uploadButton} onPress={() => setShowModal(true)}>
        <Text style={styles.uploadButtonText}>+ Add Media</Text>
      </Pressable>

      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Media</Text>
            <Pressable
              onPress={() => setShowModal(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.sectionTitle}>Media Type</Text>
            <View style={styles.mediaTypeButtons}>
              <Pressable
                style={[
                  styles.mediaTypeButton,
                  mediaType === "image" && styles.mediaTypeButtonActive,
                ]}
                onPress={() => setMediaType("image")}
              >
                <Text
                  style={[
                    styles.mediaTypeButtonText,
                    mediaType === "image" && styles.mediaTypeButtonTextActive,
                  ]}
                >
                  📷 Image
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.mediaTypeButton,
                  mediaType === "video" && styles.mediaTypeButtonActive,
                ]}
                onPress={() => setMediaType("video")}
              >
                <Text
                  style={[
                    styles.mediaTypeButtonText,
                    mediaType === "video" && styles.mediaTypeButtonTextActive,
                  ]}
                >
                  🎥 Video
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.mediaTypeButton,
                  mediaType === "audio" && styles.mediaTypeButtonActive,
                ]}
                onPress={() => setMediaType("audio")}
              >
                <Text
                  style={[
                    styles.mediaTypeButtonText,
                    mediaType === "audio" && styles.mediaTypeButtonTextActive,
                  ]}
                >
                  🎵 Audio
                </Text>
              </Pressable>
            </View>

            <Text style={styles.sectionTitle}>Media URL</Text>
            <TextInput
              style={styles.input}
              value={mediaUrl}
              onChangeText={setMediaUrl}
              placeholder="https://example.com/your-media.jpg"
              keyboardType="url"
              autoCapitalize="none"
            />

            <Text style={styles.sectionTitle}>Caption (Optional)</Text>
            <TextInput
              style={[styles.input, styles.captionInput]}
              value={caption}
              onChangeText={setCaption}
              placeholder="Add a caption..."
              multiline
              numberOfLines={3}
            />

            <Pressable
              style={[
                styles.uploadButton,
                uploading && styles.uploadButtonDisabled,
              ]}
              onPress={handleUpload}
              disabled={uploading}
            >
              <Text style={styles.uploadButtonText}>
                {uploading ? "Uploading..." : "Upload Media"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  uploadButton: {
    backgroundColor: "#111827",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  uploadButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  uploadButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: "#6b7280",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
    marginTop: 16,
  },
  mediaTypeButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  mediaTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "white",
    alignItems: "center",
  },
  mediaTypeButtonActive: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },
  mediaTypeButtonText: {
    fontSize: 14,
    color: "#6b7280",
  },
  mediaTypeButtonTextActive: {
    color: "white",
    fontWeight: "600",
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
  captionInput: {
    textAlignVertical: "top",
  },
});
