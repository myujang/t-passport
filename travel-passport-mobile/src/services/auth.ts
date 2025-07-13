import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import { makeRedirectUri } from 'expo-auth-session';
import apiService from './api';
import { User, AuthState } from '../types';

const AUTH0_DOMAIN = 'YOUR_AUTH0_DOMAIN'; // Update with your Auth0 domain
const AUTH0_CLIENT_ID = 'YOUR_AUTH0_CLIENT_ID'; // Update with your Auth0 client ID
const AUTH0_AUDIENCE = 'https://travelpassport.my/api'; // Update with your API identifier

class AuthService {
  private static instance: AuthService;
  private authState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    accessToken: null,
  };
  private listeners: Array<(state: AuthState) => void> = [];

  private constructor() {
    this.initializeAuth();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private async initializeAuth(): Promise<void> {
    this.setLoading(true);
    
    try {
      const accessToken = await SecureStore.getItemAsync('accessToken');
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      
      if (accessToken) {
        await apiService.setAccessToken(accessToken);
        
        try {
          const user = await apiService.getCurrentUser();
          this.updateAuthState({
            user,
            isAuthenticated: true,
            accessToken,
            isLoading: false,
          });
        } catch (error) {
          // Token might be expired, try to refresh
          if (refreshToken) {
            await this.refreshAccessToken(refreshToken);
          } else {
            await this.logout();
          }
        }
      } else {
        this.setLoading(false);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      this.setLoading(false);
    }
  }

  private updateAuthState(updates: Partial<AuthState>): void {
    this.authState = { ...this.authState, ...updates };
    this.notifyListeners();
  }

  private setLoading(isLoading: boolean): void {
    this.updateAuthState({ isLoading });
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.authState));
  }

  public subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public getAuthState(): AuthState {
    return this.authState;
  }

  public async login(): Promise<void> {
    this.setLoading(true);

    try {
      const redirectUri = makeRedirectUri({
        scheme: 'travel-passport',
        path: 'auth',
      });

      const discovery = {
        authorizationEndpoint: `https://${AUTH0_DOMAIN}/authorize`,
        tokenEndpoint: `https://${AUTH0_DOMAIN}/oauth/token`,
        revocationEndpoint: `https://${AUTH0_DOMAIN}/oauth/revoke`,
      };

      const authRequestConfig: AuthSession.AuthRequestConfig = {
        responseType: AuthSession.ResponseType.Code,
        clientId: AUTH0_CLIENT_ID,
        redirectUri,
        scopes: ['openid', 'profile', 'email'],
        extraParams: {
          audience: AUTH0_AUDIENCE,
        },
      };

      const authRequest = new AuthSession.AuthRequest(authRequestConfig);

      const result = await authRequest.promptAsync(discovery);

      if (result.type === 'success') {
        const tokenResult = await AuthSession.exchangeCodeAsync(
          {
            clientId: AUTH0_CLIENT_ID,
            code: result.params.code,
            redirectUri,
            extraParams: {
              code_verifier: authRequest.codeVerifier || '',
            },
          },
          discovery
        );

        if (tokenResult.accessToken) {
          await this.handleSuccessfulAuth(tokenResult);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      this.setLoading(false);
      throw error;
    }
  }

  private async handleSuccessfulAuth(tokenResult: AuthSession.TokenResponse): Promise<void> {
    try {
      // Store tokens securely
      await SecureStore.setItemAsync('accessToken', tokenResult.accessToken);
      if (tokenResult.refreshToken) {
        await SecureStore.setItemAsync('refreshToken', tokenResult.refreshToken);
      }

      // Set token in API service
      await apiService.setAccessToken(tokenResult.accessToken);

      // Get user profile from Auth0
      const userInfoResponse = await fetch(`https://${AUTH0_DOMAIN}/userinfo`, {
        headers: {
          Authorization: `Bearer ${tokenResult.accessToken}`,
        },
      });

      const userInfo = await userInfoResponse.json();

      // Register/get user in our backend
      let user: User;
      try {
        user = await apiService.getCurrentUser();
      } catch (error) {
        // User doesn't exist, register them
        user = await apiService.registerUser({
          email: userInfo.email,
          name: userInfo.name,
          auth0Id: userInfo.sub,
        });
      }

      this.updateAuthState({
        user,
        isAuthenticated: true,
        accessToken: tokenResult.accessToken,
        isLoading: false,
      });
    } catch (error) {
      console.error('Auth handling error:', error);
      this.setLoading(false);
      throw error;
    }
  }

  private async refreshAccessToken(refreshToken: string): Promise<void> {
    try {
      const discovery = {
        authorizationEndpoint: `https://${AUTH0_DOMAIN}/authorize`,
        tokenEndpoint: `https://${AUTH0_DOMAIN}/oauth/token`,
        revocationEndpoint: `https://${AUTH0_DOMAIN}/oauth/revoke`,
      };

      const tokenResult = await AuthSession.refreshAsync(
        {
          clientId: AUTH0_CLIENT_ID,
          refreshToken,
        },
        discovery
      );

      if (tokenResult.accessToken) {
        await this.handleSuccessfulAuth(tokenResult);
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      await this.logout();
    }
  }

  public async logout(): Promise<void> {
    this.setLoading(true);

    try {
      // Clear stored tokens
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');

      // Clear API service token
      await apiService.setAccessToken(null);

      // Update auth state
      this.updateAuthState({
        user: null,
        isAuthenticated: false,
        accessToken: null,
        isLoading: false,
      });

      // Optional: Logout from Auth0 (clears session)
      const redirectUri = makeRedirectUri({
        scheme: 'travel-passport',
        path: 'auth',
      });

      const logoutUrl = `https://${AUTH0_DOMAIN}/v2/logout?client_id=${AUTH0_CLIENT_ID}&returnTo=${encodeURIComponent(redirectUri)}`;
      
      // Note: AuthSession.startAsync is deprecated, using web browser instead
      // You can implement a proper logout flow or just clear local tokens
      console.log('Logout URL:', logoutUrl);
    } catch (error) {
      console.error('Logout error:', error);
      this.setLoading(false);
      throw error;
    }
  }

  public isAuthenticated(): boolean {
    return this.authState.isAuthenticated;
  }

  public getUser(): User | null {
    return this.authState.user;
  }

  public getAccessToken(): string | null {
    return this.authState.accessToken;
  }

  public isLoading(): boolean {
    return this.authState.isLoading;
  }
}

export default AuthService.getInstance();