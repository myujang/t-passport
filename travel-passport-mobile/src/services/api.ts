import axios, { AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APIResponse, User, State, PlaceOfInterest, UserStamp, UserPassport, StampCollectionResult } from '../types';

const API_BASE_URL = 'https://travelpassport.my/api'; // Update this with your actual domain

class ApiService {
  private static instance: ApiService;
  private baseURL: string;
  private accessToken: string | null = null;

  private constructor() {
    this.baseURL = API_BASE_URL;
    this.initializeToken();
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private async initializeToken(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      this.accessToken = token;
    } catch (error) {
      console.error('Failed to load access token:', error);
    }
  }

  public async setAccessToken(token: string | null): Promise<void> {
    this.accessToken = token;
    if (token) {
      await AsyncStorage.setItem('accessToken', token);
    } else {
      await AsyncStorage.removeItem('accessToken');
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: AxiosResponse<APIResponse<T>>): Promise<T> {
    const data = response.data;
    
    if (!data.success) {
      throw new Error(data.error || 'API request failed');
    }

    return data.data as T;
  }

  // Auth endpoints
  public async getCurrentUser(): Promise<User> {
    const response = await axios.get<APIResponse<User>>(`${this.baseURL}/auth/me`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  public async registerUser(userData: { email: string; name: string; auth0Id: string }): Promise<User> {
    const response = await axios.post<APIResponse<User>>(`${this.baseURL}/auth/register`, userData, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  // States endpoints
  public async getStates(): Promise<State[]> {
    const response = await axios.get<APIResponse<State[]>>(`${this.baseURL}/states`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  public async getState(stateId: string): Promise<State> {
    const response = await axios.get<APIResponse<State>>(`${this.baseURL}/states/${stateId}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  // Places of Interest endpoints
  public async getPlacesOfInterest(stateId?: string): Promise<PlaceOfInterest[]> {
    const url = stateId 
      ? `${this.baseURL}/places-of-interest?stateId=${stateId}`
      : `${this.baseURL}/places-of-interest`;
    
    const response = await axios.get<APIResponse<PlaceOfInterest[]>>(url, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  public async getPlaceOfInterest(placeId: string): Promise<PlaceOfInterest> {
    const response = await axios.get<APIResponse<PlaceOfInterest>>(`${this.baseURL}/places-of-interest/${placeId}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  // User Passports endpoints
  public async getUserPassports(): Promise<UserPassport[]> {
    const response = await axios.get<APIResponse<UserPassport[]>>(`${this.baseURL}/user-passports`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  public async purchasePassport(stateId: string): Promise<UserPassport> {
    const response = await axios.post<APIResponse<UserPassport>>(`${this.baseURL}/user-passports`, {
      stateId,
    }, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  // Stamps endpoints
  public async getUserStamps(passportId?: string): Promise<UserStamp[]> {
    const url = passportId 
      ? `${this.baseURL}/user-stamps?passportId=${passportId}`
      : `${this.baseURL}/user-stamps`;
    
    const response = await axios.get<APIResponse<UserStamp[]>>(url, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  public async collectStamp(data: {
    placeOfInterestId: string;
    latitude: number;
    longitude: number;
    imageUrl?: string;
  }): Promise<StampCollectionResult> {
    const response = await axios.post<APIResponse<StampCollectionResult>>(`${this.baseURL}/stamps/collect`, data, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  // Nearby places
  public async getNearbyPlaces(latitude: number, longitude: number, radius: number = 1000): Promise<PlaceOfInterest[]> {
    const response = await axios.get<APIResponse<PlaceOfInterest[]>>(`${this.baseURL}/places-of-interest/nearby`, {
      params: { latitude, longitude, radius },
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }
}

export default ApiService.getInstance();