import { Context } from 'hono';

export interface Env {
  DB: D1Database;
  AUTH0_DOMAIN: string;
  AUTH0_CLIENT_ID: string;
  AUTH0_CLIENT_SECRET: string;
  AUTH0_AUDIENCE: string;
  JWT_SECRET: string;
  ENVIRONMENT: string;
  ASSETS: any;
}

export type AppContext = Context<{ Bindings: Env }>;

export interface User {
  id: string;
  email: string;
  name: string;
  auth0_id: string;
  created_at: string;
  updated_at: string;
}

export interface State {
  id: string;
  name: string;
  code: string;
  description: string | null;
  image_url: string | null;
  passport_booklet_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlaceOfInterest {
  id: string;
  name: string;
  description: string | null;
  state_id: string;
  latitude: number;
  longitude: number;
  radius: number;
  image_url: string | null;
  stamp_image_url: string | null;
  category: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserPassport {
  id: string;
  user_id: string;
  state_id: string;
  purchased_at: string;
  is_active: boolean;
  completion_percentage: number;
}

export interface UserStamp {
  id: string;
  user_id: string;
  place_of_interest_id: string;
  collected_at: string;
  latitude: number;
  longitude: number;
  image_url: string | null;
}

export interface JWTPayload {
  sub: string;
  email: string;
  name: string;
  iat: number;
  exp: number;
  aud: string;
  iss: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface StampCollectionRequest {
  placeOfInterestId: string;
  latitude: number;
  longitude: number;
  imageUrl?: string;
}

export interface StampCollectionResult {
  success: boolean;
  message: string;
  stamp?: UserStamp;
}

export interface PlaceOfInterestWithState extends PlaceOfInterest {
  state: State;
}

export interface UserStampWithPlace extends UserStamp {
  place_of_interest: PlaceOfInterestWithState;
}

export interface UserPassportWithState extends UserPassport {
  state: State;
  stamps: UserStampWithPlace[];
}

export interface NearbyPlacesQuery {
  latitude: number;
  longitude: number;
  radius?: number;
}