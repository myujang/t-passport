export interface User {
  id: string;
  email: string;
  name: string;
  auth0Id: string;
  createdAt: string;
  updatedAt: string;
}

export interface State {
  id: string;
  name: string;
  code: string;
  description: string;
  imageUrl: string;
  passportBookletUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlaceOfInterest {
  id: string;
  name: string;
  description: string;
  stateId: string;
  state: State;
  latitude: number;
  longitude: number;
  radius: number; // in meters
  imageUrl: string;
  stampImageUrl: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserStamp {
  id: string;
  userId: string;
  user: User;
  placeOfInterestId: string;
  placeOfInterest: PlaceOfInterest;
  collectedAt: string;
  latitude: number;
  longitude: number;
  imageUrl?: string;
}

export interface UserPassport {
  id: string;
  userId: string;
  user: User;
  stateId: string;
  state: State;
  purchasedAt: string;
  isActive: boolean;
  completionPercentage: number;
  stamps: UserStamp[];
}

export interface Location {
  latitude: number;
  longitude: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
}

export interface StampCollectionResult {
  success: boolean;
  message: string;
  stamp?: UserStamp;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}