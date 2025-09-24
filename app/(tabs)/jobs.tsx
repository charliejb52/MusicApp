import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  RefreshControl,
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Link } from "expo-router";

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
};

type JobApplication = {
  id: string;
  job_id: string;
  artist_id: string;
  message?: string;
  status: string;
  created_at: string;
};

export default function JobsScreen() {
  const { user, profile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchJobs();
    if (profile?.user_type === "artist") {
      fetchApplications();
    }
  }, [profile]);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select(`
          *,
          venue:user_profiles!jobs_venue_id_fkey(display_name)
        `)
        .eq("status", "open")
        .order("event_date", { ascending: true });

      if (error) {
        console.error("Error fetching jobs:", error);
        return;
      }

      const formattedJobs = data?.map((job: any) => ({
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
    const existingApplication = applications.find(app => app.job_id === jobId);
    if (existingApplication) {
      Alert.alert("Already Applied", "You have already applied for this job");
      return;
    }

    try {
      const { error } = await supabase
        .from("job_applications")
        .insert({
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
    await fetchJobs();
    if (profile?.user_type === "artist") {
      await fetchApplications();
    }
    setRefreshing(false);
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
    return applications.some(app => app.job_id === jobId);
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
        <Text style={styles.title}>Gig Opportunities</Text>
        {profile?.user_type === "venue" && (
          <Link href="/post-job" asChild>
            <Pressable style={styles.postJobButton}>
              <Text style={styles.postJobText}>+ Post Job</Text>
            </Pressable>
          </Link>
        )}
      </View>

      {jobs.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No gigs available</Text>
          <Text style={styles.emptySubtitle}>
            Check back later for new opportunities
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

              <Text style={styles.venueName}>{job.venue_name}</Text>
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
                  <Text style={styles.requirementsText}>{job.requirements}</Text>
                </View>
              )}

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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  postJobButton: {
    backgroundColor: "#111827",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  postJobText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
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
});
