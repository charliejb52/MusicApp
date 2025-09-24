import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import * as Location from "expo-location";
import { Link, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Callout, Marker, PROVIDER_GOOGLE } from "react-native-maps";

type Venue = {
  id: string;
  name: string;
  genre: string;
  coordinate: { latitude: number; longitude: number };
  address: string;
  description?: string;
  website?: string;
  phone?: string;
  capacity?: number;
};

export default function MapScreen() {
  const mapRef = useRef<MapView | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialRegion, setInitialRegion] = useState({
    latitude: 35.9992,
    longitude: -78.9083,
    latitudeDelta: 0.12,
    longitudeDelta: 0.12,
  });
  const params = useLocalSearchParams<{ venue?: string }>();
  const { profile } = useAuth();

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  useEffect(() => {
    fetchVenues();
    updateInitialLocation();
  }, [profile]);

  const updateInitialLocation = async () => {
    if (profile?.location) {
      try {
        // Try to geocode the user's location
        const coordinates = await geocodeLocation(profile.location);
        if (coordinates) {
          setInitialRegion({
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            latitudeDelta: 0.12,
            longitudeDelta: 0.12,
          });
        }
      } catch (error) {
        console.error("Error geocoding location:", error);
        // Keep default Durham location if geocoding fails
      }
    }
  };

  const geocodeLocation = async (
    locationString: string
  ): Promise<{ latitude: number; longitude: number } | null> => {
    try {
      // Use a simple geocoding approach - for now, we'll use some common city coordinates
      // In a real app, you'd use a proper geocoding service like Google Maps Geocoding API
      const locationMap: Record<
        string,
        { latitude: number; longitude: number }
      > = {
        "durham, nc": { latitude: 35.9992, longitude: -78.9083 },
        "durham, north carolina": { latitude: 35.9992, longitude: -78.9083 },
        "raleigh, nc": { latitude: 35.7796, longitude: -78.6382 },
        "raleigh, north carolina": { latitude: 35.7796, longitude: -78.6382 },
        "charlotte, nc": { latitude: 35.2271, longitude: -80.8431 },
        "charlotte, north carolina": { latitude: 35.2271, longitude: -80.8431 },
        "asheville, nc": { latitude: 35.5951, longitude: -82.5515 },
        "asheville, north carolina": { latitude: 35.5951, longitude: -82.5515 },
        "winston-salem, nc": { latitude: 36.0999, longitude: -80.2442 },
        "winston-salem, north carolina": {
          latitude: 36.0999,
          longitude: -80.2442,
        },
        "greensboro, nc": { latitude: 36.0726, longitude: -79.792 },
        "greensboro, north carolina": { latitude: 36.0726, longitude: -79.792 },
        "new york, ny": { latitude: 40.7128, longitude: -74.006 },
        "new york, new york": { latitude: 40.7128, longitude: -74.006 },
        "los angeles, ca": { latitude: 34.0522, longitude: -118.2437 },
        "los angeles, california": { latitude: 34.0522, longitude: -118.2437 },
        "chicago, il": { latitude: 41.8781, longitude: -87.6298 },
        "chicago, illinois": { latitude: 41.8781, longitude: -87.6298 },
        "austin, tx": { latitude: 30.2672, longitude: -97.7431 },
        "austin, texas": { latitude: 30.2672, longitude: -97.7431 },
        "nashville, tn": { latitude: 36.1627, longitude: -86.7816 },
        "nashville, tennessee": { latitude: 36.1627, longitude: -86.7816 },
      };

      const normalizedLocation = locationString.toLowerCase().trim();
      return locationMap[normalizedLocation] || null;
    } catch (error) {
      console.error("Error in geocoding:", error);
      return null;
    }
  };

  const fetchVenues = async () => {
    try {
      const { data, error } = await supabase.from("venues").select("*");

      if (error) {
        console.error("Error fetching venues:", error);
        return;
      }

      const formattedVenues =
        data?.map((venue) => ({
          id: venue.id,
          name: venue.name,
          genre: venue.genre,
          coordinate: { latitude: venue.latitude, longitude: venue.longitude },
          address: venue.address,
          description: venue.description,
          website: venue.website,
          phone: venue.phone,
          capacity: venue.capacity,
        })) || [];

      setVenues(formattedVenues);
    } catch (error) {
      console.error("Error fetching venues:", error);
    } finally {
      setLoading(false);
    }
  };

  const centerOnUser = async () => {
    if (!hasPermission) return;
    const loc = await Location.getCurrentPositionAsync({});
    const region = {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      latitudeDelta: 0.04,
      longitudeDelta: 0.04,
    };
    mapRef.current?.animateToRegion(region, 500);
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        showsUserLocation={hasPermission === true}
        initialRegion={initialRegion}
      >
        {venues.map((venue) => (
          <Marker
            key={venue.id}
            coordinate={venue.coordinate}
            title={venue.name}
            description={`${venue.genre} • ${venue.address}`}
          >
            <Callout style={styles.callout}>
              <View style={styles.calloutContent}>
                <Text style={styles.calloutTitle}>{venue.name}</Text>
                <Text style={styles.calloutGenre}>{venue.genre}</Text>
                <Text style={styles.calloutAddress}>{venue.address}</Text>
                {venue.description && (
                  <Text style={styles.calloutDescription}>
                    {venue.description}
                  </Text>
                )}
                {venue.capacity && (
                  <Text style={styles.calloutCapacity}>
                    Capacity: {venue.capacity}
                  </Text>
                )}
                {venue.phone && (
                  <Text style={styles.calloutPhone}>📞 {venue.phone}</Text>
                )}
              </View>
            </Callout>
          </Marker>
        ))}

        {(() => {
          if (!params.venue) return null;
          try {
            const v = JSON.parse(decodeURIComponent(String(params.venue)));
            return (
              <Marker
                key={v.id}
                coordinate={v.coordinate}
                title={v.name}
                description={`${v.genre} • ${v.address}`}
                pinColor="#111827"
                onLayout={() => {
                  mapRef.current?.animateToRegion(
                    {
                      latitude: v.coordinate.latitude,
                      longitude: v.coordinate.longitude,
                      latitudeDelta: 0.03,
                      longitudeDelta: 0.03,
                    },
                    500
                  );
                }}
              />
            );
          } catch {
            return null;
          }
        })()}
      </MapView>

      <Pressable
        onPress={centerOnUser}
        style={styles.locateBtn}
        accessibilityLabel="Locate me"
      >
        <View style={styles.fab} />
      </Pressable>

      <Link href="/modal" asChild>
        <Pressable style={styles.addBtn} accessibilityLabel="Add Venue">
          <View style={[styles.fab, styles.addFab]} />
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  callout: {
    width: 250,
    padding: 0,
  },
  calloutContent: {
    padding: 12,
    backgroundColor: "white",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#111827",
  },
  calloutGenre: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
    fontStyle: "italic",
  },
  calloutAddress: {
    fontSize: 13,
    color: "#374151",
    marginBottom: 8,
  },
  calloutDescription: {
    fontSize: 13,
    color: "#4B5563",
    marginBottom: 6,
    lineHeight: 18,
  },
  calloutCapacity: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  calloutPhone: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "500",
  },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locateBtn: {
    position: "absolute",
    right: 16,
    bottom: 88,
  },
  addBtn: {
    position: "absolute",
    right: 16,
    bottom: 24,
  },
  addFab: {
    backgroundColor: "#111827",
  },
});
