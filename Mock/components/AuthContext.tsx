import React, { createContext, useState, useEffect, useContext } from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface UserToken {
  token: string | null;
}
interface Address {
  street_1: string;
  street_2: string;
  city: string;
  region: string;
  country: string;
}
interface UserInfo {
  user: {
    id: number;
    first_name: string;
    last_name: string;
    token: string;
    address: Address;
    email: string;
    dob: string;
    program_of_study: number;
    profile_picture: string;
  };
}

interface AuthContextType {
  userToken: UserToken | null;
  userInfo: UserInfo | null;
  login: (user: UserInfo, token: string) => Promise<void>;
  logout: () => Promise<void>;
  setUserInfo: (userInfo: UserInfo) => void;
  setUserInformation: (userInfo: any) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getItem = async (key: string, timeout = 3000): Promise<string | null> => {
  try {
    if (Platform.OS === "web") {
      return await Promise.race([
        AsyncStorage.getItem(key),
        new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error(`getItem timeout for ${key}`)), timeout)
        ),
      ]);
    } else {
      return await Promise.race([
        SecureStore.getItemAsync(key),
        new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error(`getItem timeout for ${key}`)), timeout)
        ),
      ]);
    }
  } catch (error) {
    console.warn(`[AuthContext] Error getting item ${key}:`, error);
    return null;
  }
};

const setItem = async (key: string, value: string, timeout = 3000): Promise<void> => {
  try {
    if (Platform.OS === "web") {
      await Promise.race([
        AsyncStorage.setItem(key, value),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`setItem timeout for ${key}`)), timeout)
        ),
      ]);
    } else {
      await Promise.race([
        SecureStore.setItemAsync(key, value),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`setItem timeout for ${key}`)), timeout)
        ),
      ]);
    }
  } catch (error) {
    console.warn(`[AuthContext] Error setting item ${key}:`, error);
    throw error;
  }
};

const deleteItem = async (key: string, timeout = 3000): Promise<void> => {
  try {
    if (Platform.OS === "web") {
      await Promise.race([
        AsyncStorage.removeItem(key),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`deleteItem timeout for ${key}`)), timeout)
        ),
      ]);
    } else {
      await Promise.race([
        SecureStore.deleteItemAsync(key),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`deleteItem timeout for ${key}`)), timeout)
        ),
      ]);
    }
  } catch (error) {
    console.warn(`[AuthContext] Error deleting item ${key}:`, error);
    // Don't throw - deletion failures are non-critical
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [userToken, setUserToken] = useState<UserToken | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthentication = async () => {
      const INIT_TIMEOUT = 5000; // 5 second timeout
      const startTime = Date.now();
      
      console.log("[AuthContext] Starting authentication check");
      
      try {
        // Create a timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error("Authentication check timeout"));
          }, INIT_TIMEOUT);
        });

        // Race between auth check and timeout
        const authCheckPromise = (async () => {
          try {
            console.log("[AuthContext] Fetching token from storage");
            const token = await Promise.race([
              getItem("token"),
              timeoutPromise,
            ]);
            
            console.log("[AuthContext] Fetching user from storage");
            const user = await Promise.race([
              getItem("user"),
              timeoutPromise,
            ]);

            if (token && user) {
              try {
                const parsedUser = JSON.parse(user);
                setUserToken({ token });
                setUserInfo(parsedUser);
                console.log("[AuthContext] User authenticated successfully");
              } catch (parseError) {
                console.warn("[AuthContext] Failed to parse user data:", parseError);
                setUserToken(null);
                setUserInfo(null);
              }
            } else {
              console.log("[AuthContext] No stored credentials found");
              setUserToken(null);
              setUserInfo(null);
            }
          } catch (error) {
            console.warn("[AuthContext] Error during auth check:", error);
            // On error, assume not authenticated
            setUserToken(null);
            setUserInfo(null);
          }
        })();

        await Promise.race([authCheckPromise, timeoutPromise]);
        
        const elapsed = Date.now() - startTime;
        console.log(`[AuthContext] Authentication check completed in ${elapsed}ms`);
      } catch (error) {
        console.error("[AuthContext] Authentication check failed or timed out:", error);
        // On timeout or error, assume not authenticated and continue
        setUserToken(null);
        setUserInfo(null);
      } finally {
        setIsLoading(false);
        console.log("[AuthContext] Loading state set to false");
      }
    };

    checkAuthentication();
  }, []);

  const login = async (user: UserInfo, token: string) => {
    await setItem("token", token);
    await setItem("user", JSON.stringify(user));

    setUserToken({ token });
    setUserInfo(user);
  };
  const setUserInformation = async (userInfo: any) => {
    try {
      await setItem("user", JSON.stringify(userInfo));
    } catch (error) {}
  };

  const logout = async () => {
    await deleteItem("token");
    await deleteItem("user");

    setUserToken(null);
    setUserInfo(null);
  };

  return (
    <AuthContext.Provider
      value={{
        userInfo,
        userToken,
        login,
        logout,
        setUserInfo,
        setUserInformation,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
