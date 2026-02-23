import { useState, useEffect } from "react";

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation() {
  const [location, setLocation] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation({
        latitude: null,
        longitude: null,
        error: "Geolocation is not supported by your browser",
        loading: false,
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
          loading: false,
        });
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocation({
          latitude: null,
          longitude: null,
          error: error.message,
          loading: false,
        });
      },
      {
        enableHighAccuracy: true, // Use GPS for better accuracy
        timeout: 10000, // Increased timeout to 10 seconds
        maximumAge: 60000, // Cache for only 1 minute for more accurate location
      }
    );
  }, []);

  return location;
}
