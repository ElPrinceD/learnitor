import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { queryClient } from '../QueryClient';
import { useCacheStore } from './cacheStore';

// ── Types ──────────────────────────────────────────────────────────────
export interface UserToken {
  token: string | null;
}

export interface Address {
  street_1: string;
  street_2: string;
  city: string;
  region: string;
  country: string;
}

export interface UserInfo {
  user: {
    id: number;
    first_name: string;
    last_name: string;
    token: string;
    address: Address;
    email: string;
    dob?: string;
    username?: string;
    institution_id?: number;
    program_of_study?: number;
    profile_picture: string;
  };
}

interface AuthState {
  userToken: UserToken | null;
  userInfo: UserInfo | null;
  isLoading: boolean;

  // Actions
  login: (user: UserInfo, token: string) => Promise<void>;
  logout: () => Promise<void>;
  setUserInfo: (userInfo: UserInfo) => void;
  setUserInformation: (userInfo: any) => Promise<void>;
  _hydrate: () => Promise<void>;
}

// ── Platform-aware secure storage adapter ──────────────────────────────
const getItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return await AsyncStorage.getItem(key);
  }
  return await SecureStore.getItemAsync(key);
};

const setItem = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
};

const deleteItem = async (key: string): Promise<void> => {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
};

// ── Store ──────────────────────────────────────────────────────────────
export const useAuthStore = create<AuthState>()((set) => ({
  userToken: null,
  userInfo: null,
  isLoading: true,

  _hydrate: async () => {
    try {
      const token = await getItem('token');
      const user = await getItem('user');

      if (token && user) {
        set({
          userToken: { token },
          userInfo: JSON.parse(user),
          isLoading: false,
        });
      } else {
        set({ userToken: null, userInfo: null, isLoading: false });
      }
    } catch {
      set({ userToken: null, userInfo: null, isLoading: false });
    }
  },

  login: async (user, token) => {
    // Prevent leak by clearing both QueryClient cache and SQLite cache first
    try {
      queryClient.clear();
      await useCacheStore.getState().clear();
    } catch (e) {
      console.warn('Error clearing caches on login:', e);
    }

    await setItem('token', token);
    await setItem('user', JSON.stringify(user));

    set({
      userToken: { token },
      userInfo: user,
    });
  },

  logout: async () => {
    // Clear both QueryClient cache and SQLite cache on logout
    try {
      queryClient.clear();
      await useCacheStore.getState().clear();
    } catch (e) {
      console.warn('Error clearing caches on logout:', e);
    }

    await deleteItem('token');
    await deleteItem('user');

    set({
      userToken: null,
      userInfo: null,
    });
  },

  setUserInfo: (userInfo) => {
    set({ userInfo });
  },

  setUserInformation: async (userInfo) => {
    try {
      await setItem('user', JSON.stringify(userInfo));
      set({ userInfo });
    } catch {
      // Silent failure — matches original behavior
    }
  },
}));

// Trigger hydration on module load (runs once)
useAuthStore.getState()._hydrate();

// ── Backward-compatible hook ───────────────────────────────────────────
// Consumers that import `useAuth` from this file or from the old
// `AuthContext.tsx` (which now re-exports this) get the same API shape.
export const useAuth = () => {
  const store = useAuthStore();
  return {
    userToken: store.userToken,
    userInfo: store.userInfo,
    isLoading: store.isLoading,
    login: store.login,
    logout: store.logout,
    setUserInfo: store.setUserInfo,
    setUserInformation: store.setUserInformation,
  };
};
