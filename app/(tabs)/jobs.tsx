import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Link } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Job = {
  id: string;
  title: string;
  description: string;
  genre: string;
  event_date: string;
  pay_range?: string;
  requirements?: string;
  contact_info?: string;
  location: string;
  venue_name: string;
  venue_id: string;
  status: string;
  created_at: string;
  applications?: JobApplication[];
};

type JobApplication = {
  id: string;
  job_id: string;
  artist_id: string;
  message?: string;
  status: string;
  created_at: string;
  artist?: {
    display_name: string;
    email: string;
    profile_picture_url?: string;
  };
};

export default function JobsScreen() {
  const { user, profile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (profile?.user_type === "venue") {
      fetchVenueJobs();
    } else {
      fetchJobs();
      if (profile?.user_type === "artist") {
        fetchApplications();
      }
    }
  }, [profile]);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select(
          `
          *,
          venue:user_profiles!jobs_venue_id_fkey(display_name)
        `
        )
        .eq("status", "open")
        .order("event_date", { ascending: true });

      if (error) {
        console.error("Error fetching jobs:", error);
        return;
      }

      const formattedJobs =
        data?.map((job: any) => ({
          ...job,
          venue_name: job.venue?.display_name || "Unknown Venue",
        })) || [];

      setJobs(formattedJobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVenueJobs = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("jobs")
        .select(
          `
          *,
          applications:job_applications(
            id,
            artist_id,
            message,
            status,
            created_at,
            artist:user_profiles!job_applications_artist_id_fkey(
              display_name,
              email,
              profile_picture_url
            )
          )
        `
        )
        .eq("venue_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching venue jobs:", error);
        return;
      }

      setJobs(data || []);
    } catch (error) {
      console.error("Error fetching venue jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("job_applications")
        .select("*")
        .eq("artist_id", user.id);

      if (error) {
        console.error("Error fetching applications:", error);
        return;
      }

      setApplications(data || []);
    } catch (error) {
      console.error("Error fetching applications:", error);
    }
  };

  const handleApply = async (jobId: string) => {
    if (!user || profile?.user_type !== "artist") {
      Alert.alert("Error", "Only artists can apply for jobs");
      return;
    }

    // Check if already applied
    const existingApplication = applications.find(
      (app) => app.job_id === jobId
    );
    if (existingApplication) {
      Alert.alert("Already Applied", "You have already applied for this job");
      return;
    }

    try {
      const { error } = await supabase.from("job_applications").insert({
        job_id: jobId,
        artist_id: user.id,
        message: "I'm interested in this opportunity!",
      });

      if (error) {
        Alert.alert("Error", "Failed to apply for job");
        console.error("Error applying for job:", error);
      } else {
        Alert.alert("Success", "Application submitted successfully!");
        fetchApplications(); // Refresh applications
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong");
      console.error("Error applying for job:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (profile?.user_type === "venue") {
      await fetchVenueJobs();
    } else {
      await fetchJobs();
      if (profile?.user_type === "artist") {
        await fetchApplications();
      }
    }
    setRefreshing(false);
  };

  const handleApplicationStatus = async (
    applicationId: string,
    status: "accepted" | "rejected"
  ) => {
    try {
      const { error } = await supabase
        .from("job_applications")
        .update({ status })
        .eq("id", applicationId);

      if (error) {
        Alert.alert("Error", "Failed to update application status");
        console.error("Error updating application:", error);
      } else {
        Alert.alert("Success", `Application ${status} successfully!`);
        fetchVenueJobs(); // Refresh to show updated status
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong");
      console.error("Error updating application:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const hasApplied = (jobId: string) => {
    return applications.some((app) => app.job_id === jobId);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading jobs...</Text>
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
        <Text style={styles.title}>
          {profile?.user_type === "venue" ? "My Gigs" : "Gig Opportunities"}
        </Text>
      </View>

      {profile?.user_type === "venue" && (
        <View style={styles.venueActions}>
          <Link href="/post-job" asChild>
            <Pressable style={styles.postJobButton}>
              <Text style={styles.postJobText}>+ Post New Gig</Text>
            </Pressable>
          </Link>
        </View>
      )}

      {jobs.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>
            {profile?.user_type === "venue"
              ? "No gigs posted yet"
              : "No gigs available"}
          </Text>
          <Text style={styles.emptySubtitle}>
            {profile?.user_type === "venue"
              ? "Post your first gig to start receiving applications"
              : "Check back later for new opportunities"}
          </Text>
        </View>
      ) : (
        <View style={styles.jobsList}>
          {jobs.map((job) => (
            <View key={job.id} style={styles.jobCard}>
              <View style={styles.jobHeader}>
                <Text style={styles.jobTitle}>{job.title}</Text>
                <Text style={styles.jobDate}>{formatDate(job.event_date)}</Text>
              </View>

              {profile?.user_type === "artist" && (
                <Text style={styles.venueName}>{job.venue_name}</Text>
              )}

              <Text style={styles.jobLocation}>📍 {job.location}</Text>
              <Text style={styles.jobGenre}>🎵 {job.genre}</Text>

              {job.pay_range && (
                <Text style={styles.jobPay}>💰 {job.pay_range}</Text>
              )}

              <Text style={styles.jobDescription} numberOfLines={3}>
                {job.description}
              </Text>

              {job.requirements && (
                <View style={styles.requirementsContainer}>
                  <Text style={styles.requirementsTitle}>Requirements:</Text>
                  <Text style={styles.requirementsText}>
                    {job.requirements}
                  </Text>
                </View>
              )}

              {/* Venue-specific: Show applications */}
              {profile?.user_type === "venue" &&
                job.applications &&
                job.applications.length > 0 && (
                  <View style={styles.applicationsContainer}>
                    <Text style={styles.applicationsTitle}>
                      Applications ({job.applications.length})
                    </Text>
                    {job.applications.map((application: any) => (
                      <View key={application.id} style={styles.applicationCard}>
                        <View style={styles.applicationHeader}>
                          <Text style={styles.artistName}>
                            {application.artist?.display_name ||
                              "Unknown Artist"}
                          </Text>
                          <Text style={styles.applicationStatus}>
                            {application.status}
                          </Text>
                        </View>
                        {application.message && (
                          <Text style={styles.applicationMessage}>
                            "{application.message}"
                          </Text>
                        )}
                        {application.status === "pending" && (
                          <View style={styles.applicationActions}>
                            <Pressable
                              style={[styles.statusButton, styles.acceptButton]}
                              onPress={() =>
                                handleApplicationStatus(
                                  application.id,
                                  "accepted"
                                )
                              }
                            >
                              <Text style={styles.acceptButtonText}>
                                Accept
                              </Text>
                            </Pressable>
                            <Pressable
                              style={[styles.statusButton, styles.rejectButton]}
                              onPress={() =>
                                handleApplicationStatus(
                                  application.id,
                                  "rejected"
                                )
                              }
                            >
                              <Text style={styles.rejectButtonText}>
                                Reject
                              </Text>
                            </Pressable>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}

              {/* Artist-specific: Apply button */}
              {profile?.user_type === "artist" && (
                <Pressable
                  style={[
                    styles.applyButton,
                    hasApplied(job.id) && styles.appliedButton,
                  ]}
                  onPress={() => handleApply(job.id)}
                  disabled={hasApplied(job.id)}
                >
                  <Text style={styles.applyButtonText}>
                    {hasApplied(job.id) ? "Applied ✓" : "Apply"}
                  </Text>
                </Pressable>
              )}
            </View>
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
  loadingText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: "#6b7280",
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
  venueActions: {
    backgroundColor: "white",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  postJobButton: {
    backgroundColor: "#111827",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  postJobText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
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
  jobsList: {
    padding: 16,
    gap: 16,
  },
  jobCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    flex: 1,
    marginRight: 8,
  },
  jobDate: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  venueName: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
    marginBottom: 4,
  },
  jobLocation: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  jobGenre: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  jobPay: {
    fontSize: 14,
    color: "#059669",
    fontWeight: "500",
    marginBottom: 8,
  },
  jobDescription: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
    marginBottom: 12,
  },
  requirementsContainer: {
    marginBottom: 12,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  requirementsText: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 18,
  },
  applyButton: {
    backgroundColor: "#111827",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  appliedButton: {
    backgroundColor: "#10b981",
  },
  applyButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  // Application management styles
  applicationsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  applicationsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  applicationCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  applicationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  artistName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  applicationStatus: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6b7280",
    textTransform: "uppercase",
  },
  applicationMessage: {
    fontSize: 14,
    color: "#374151",
    fontStyle: "italic",
    marginBottom: 8,
  },
  applicationActions: {
    flexDirection: "row",
    gap: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  acceptButton: {
    backgroundColor: "#10b981",
  },
  acceptButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  rejectButton: {
    backgroundColor: "#ef4444",
  },
  rejectButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});
