import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface UserSettings {
  id: string;
  ical_url: string | null;
  ical_filter_group: string | null;
  sync_enabled: boolean;
  timezone: string | null;
  campus_latitude: number | null;
  campus_longitude: number | null;
  campus_radius_meters: number;
  campus_name: string | null;
}

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  isOnCampus: boolean | null;
  distanceFromCampus: number | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export const useGeolocation = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [geoState, setGeoState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    isOnCampus: null,
    distanceFromCampus: null,
    loading: false,
    error: null,
    lastUpdated: null,
  });

  // Fetch user settings with campus location
  useEffect(() => {
    if (!user) return;

    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setSettings(data as UserSettings);
      }
    };

    fetchSettings();
  }, [user]);

  // Calculate distance between two points using Haversine formula
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }, []);

  // Check if position is on campus
  const checkOnCampus = useCallback((latitude: number, longitude: number): { isOnCampus: boolean; distance: number } => {
    if (!settings?.campus_latitude || !settings?.campus_longitude) {
      return { isOnCampus: false, distance: -1 };
    }

    const distance = calculateDistance(
      latitude, 
      longitude, 
      settings.campus_latitude, 
      settings.campus_longitude
    );

    const radius = settings.campus_radius_meters || 500;
    return {
      isOnCampus: distance <= radius,
      distance: Math.round(distance),
    };
  }, [settings, calculateDistance]);

  // Get current position
  const getCurrentPosition = useCallback((): Promise<GeolocationState> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        const errorState = {
          ...geoState,
          error: "Géolocalisation non supportée",
          loading: false,
        };
        setGeoState(errorState);
        resolve(errorState);
        return;
      }

      setGeoState(prev => ({ ...prev, loading: true, error: null }));

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const campusCheck = checkOnCampus(latitude, longitude);
          
          const newState: GeolocationState = {
            latitude,
            longitude,
            accuracy,
            isOnCampus: settings?.campus_latitude ? campusCheck.isOnCampus : null,
            distanceFromCampus: campusCheck.distance,
            loading: false,
            error: null,
            lastUpdated: new Date(),
          };
          
          setGeoState(newState);
          resolve(newState);
        },
        (error) => {
          let errorMessage = "Erreur de géolocalisation";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Permission de localisation refusée";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Position non disponible";
              break;
            case error.TIMEOUT:
              errorMessage = "Délai dépassé";
              break;
          }
          
          const errorState: GeolocationState = {
            ...geoState,
            loading: false,
            error: errorMessage,
            lastUpdated: new Date(),
          };
          setGeoState(errorState);
          resolve(errorState);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000, // 1 minute cache
        }
      );
    });
  }, [settings, checkOnCampus, geoState]);

  // Save campus location
  const saveCampusLocation = useCallback(async (
    latitude: number, 
    longitude: number, 
    name: string,
    radiusMeters: number = 500
  ): Promise<boolean> => {
    if (!user) return false;

    const { error } = await supabase
      .from('user_settings')
      .update({
        campus_latitude: latitude,
        campus_longitude: longitude,
        campus_name: name,
        campus_radius_meters: radiusMeters,
      })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error saving campus location:', error);
      return false;
    }

    setSettings(prev => prev ? {
      ...prev,
      campus_latitude: latitude,
      campus_longitude: longitude,
      campus_name: name,
      campus_radius_meters: radiusMeters,
    } : null);

    return true;
  }, [user]);

  // Set current location as campus
  const setCurrentAsCampus = useCallback(async (name: string): Promise<boolean> => {
    const position = await getCurrentPosition();
    if (position.latitude && position.longitude) {
      return saveCampusLocation(position.latitude, position.longitude, name);
    }
    return false;
  }, [getCurrentPosition, saveCampusLocation]);

  // Determine context mode (on campus vs work from home)
  const getContextMode = useCallback((): 'campus' | 'home' | 'unknown' => {
    if (geoState.isOnCampus === true) return 'campus';
    if (geoState.isOnCampus === false && settings?.campus_latitude) return 'home';
    return 'unknown';
  }, [geoState.isOnCampus, settings]);

  return {
    ...geoState,
    settings,
    hasCampusConfigured: !!(settings?.campus_latitude && settings?.campus_longitude),
    campusName: settings?.campus_name || null,
    getCurrentPosition,
    saveCampusLocation,
    setCurrentAsCampus,
    checkOnCampus,
    getContextMode,
  };
};
