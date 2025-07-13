import * as Location from 'expo-location';
import { Location as LocationType, PlaceOfInterest, StampCollectionResult } from '../types';
import apiService from './api';

interface LocationWatchResult {
  location: LocationType;
  nearbyPlaces: PlaceOfInterest[];
}

class LocationService {
  private static instance: LocationService;
  private watchSubscription: Location.LocationSubscription | null = null;
  private currentLocation: LocationType | null = null;
  private listeners: Array<(result: LocationWatchResult) => void> = [];

  private constructor() {}

  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  public async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  public async getCurrentLocation(): Promise<LocationType | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
      });

      this.currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      return this.currentLocation;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  public async startWatchingLocation(): Promise<void> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      this.watchSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 50, // Update when moved 50 meters
        },
        async (location) => {
          const newLocation: LocationType = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };

          this.currentLocation = newLocation;

          // Get nearby places
          try {
            const nearbyPlaces = await apiService.getNearbyPlaces(
              newLocation.latitude,
              newLocation.longitude,
              1000 // 1km radius
            );

            this.notifyListeners({
              location: newLocation,
              nearbyPlaces,
            });
          } catch (error) {
            console.error('Error fetching nearby places:', error);
            this.notifyListeners({
              location: newLocation,
              nearbyPlaces: [],
            });
          }
        }
      );
    } catch (error) {
      console.error('Error starting location watch:', error);
      throw error;
    }
  }

  public stopWatchingLocation(): void {
    if (this.watchSubscription) {
      this.watchSubscription.remove();
      this.watchSubscription = null;
    }
  }

  public subscribe(listener: (result: LocationWatchResult) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(result: LocationWatchResult): void {
    this.listeners.forEach(listener => listener(result));
  }

  public getCurrentLocationSync(): LocationType | null {
    return this.currentLocation;
  }

  public calculateDistance(
    loc1: LocationType,
    loc2: LocationType
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (loc1.latitude * Math.PI) / 180;
    const φ2 = (loc2.latitude * Math.PI) / 180;
    const Δφ = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
    const Δλ = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  public isWithinRadius(
    userLocation: LocationType,
    placeLocation: LocationType,
    radius: number
  ): boolean {
    const distance = this.calculateDistance(userLocation, placeLocation);
    return distance <= radius;
  }

  public async attemptStampCollection(
    placeOfInterest: PlaceOfInterest,
    imageUrl?: string
  ): Promise<StampCollectionResult> {
    try {
      const currentLocation = await this.getCurrentLocation();
      
      if (!currentLocation) {
        return {
          success: false,
          message: 'Unable to get current location',
        };
      }

      const placeLocation: LocationType = {
        latitude: placeOfInterest.latitude,
        longitude: placeOfInterest.longitude,
      };

      const isWithinRadius = this.isWithinRadius(
        currentLocation,
        placeLocation,
        placeOfInterest.radius
      );

      if (!isWithinRadius) {
        const distance = this.calculateDistance(currentLocation, placeLocation);
        return {
          success: false,
          message: `You are ${Math.round(distance)}m away from ${placeOfInterest.name}. You need to be within ${placeOfInterest.radius}m to collect this stamp.`,
        };
      }

      // Attempt to collect the stamp via API
      const result = await apiService.collectStamp({
        placeOfInterestId: placeOfInterest.id,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        imageUrl,
      });

      return result;
    } catch (error) {
      console.error('Error collecting stamp:', error);
      return {
        success: false,
        message: 'Failed to collect stamp. Please try again.',
      };
    }
  }

  public async getNearbyPlaces(
    location?: LocationType,
    radius: number = 1000
  ): Promise<PlaceOfInterest[]> {
    try {
      const targetLocation = location || await this.getCurrentLocation();
      
      if (!targetLocation) {
        return [];
      }

      return await apiService.getNearbyPlaces(
        targetLocation.latitude,
        targetLocation.longitude,
        radius
      );
    } catch (error) {
      console.error('Error getting nearby places:', error);
      return [];
    }
  }

  public formatDistance(distance: number): string {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    } else {
      return `${(distance / 1000).toFixed(1)}km`;
    }
  }
}

export default LocationService.getInstance();