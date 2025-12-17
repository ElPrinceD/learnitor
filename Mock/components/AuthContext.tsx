import React, { createContext, useState, useEffect, useContext, useRef } from "react";
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

// FIX #1: Wrapped storage operations with timeout and error handling
// This prevents SecureStore/AsyncStorage from hanging indefinitely
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
    // FIX #7: Catch all errors, log them, but continue startup
    console.warn(`[AuthContext] Error getting item ${key}:`, error);
    return null; // Return null instead of throwing - allows app to continue
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
    throw error; // Setting errors can throw since they're not critical for startup
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
    // FIX #7: Deletion failures are non-critical - don't throw
    console.warn(`[AuthContext] Error deleting item ${key}:`, error);
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [userToken, setUserToken] = useState<UserToken | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // FIX #10: Use ref to prevent multiple simultaneous auth checks
  const isCheckingRef = useRef(false);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    // FIX #10: Prevent multiple simultaneous checks
    if (isCheckingRef.current || hasInitializedRef.current) {
      return;
    }
    
    isCheckingRef.current = true;
    
    const checkAuthentication = async () => {
      const INIT_TIMEOUT = 5000; // FIX #6: 5 second timeout for entire auth check
      const startTime = Date.now();
      
      console.log("[AuthContext] Starting authentication check");
      
      try {
        // FIX #6: Create timeout promise that will reject if auth check takes too long
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error("Authentication check timeout"));
          }, INIT_TIMEOUT);
        });

        // FIX #5: Race between auth check and timeout - ensures we never hang
        const authCheckPromise = (async () => {
          try {
            console.log("[AuthContext] Fetching token from storage");
            // FIX #7: Each storage call has its own timeout and error handling
            const token = await Promise.race([
              getItem("token"),
              timeoutPromise,
            ]).catch(() => null); // FIX #2: Return null if token fetch fails
            
            console.log("[AuthContext] Fetching user from storage");
            const user = await Promise.race([
              getItem("user"),
              timeoutPromise,
            ]).catch(() => null); // FIX #2: Return null if user fetch fails

            // FIX #2: Handle missing token gracefully - set state to null and continue
            if (token && user) {
              try {
                const parsedUser = JSON.parse(user);
                setUserToken({ token });
                setUserInfo(parsedUser);
                console.log("[AuthContext] User authenticated successfully");
              } catch (parseError) {
                // FIX #7: Parse errors don't crash - just log and continue
                console.warn("[AuthContext] Failed to parse user data:", parseError);
                setUserToken(null);
                setUserInfo(null);
              }
            } else {
              // FIX #2: Explicitly handle missing credentials - this is normal for first launch
              console.log("[AuthContext] No stored credentials found - user not authenticated");
              setUserToken(null);
              setUserInfo(null);
            }
          } catch (error) {
            // FIX #7: Catch all errors during auth check, log them, but continue
            console.warn("[AuthContext] Error during auth check:", error);
            // FIX #2: On error, assume not authenticated and continue - don't block startup
            setUserToken(null);
            setUserInfo(null);
          }
        })();

        // FIX #6: Race ensures we never wait longer than INIT_TIMEOUT
        await Promise.race([authCheckPromise, timeoutPromise]).catch(() => {
          // Timeout is expected - we'll handle it in the catch block
        });
        
        const elapsed = Date.now() - startTime;
        console.log(`[AuthContext] Authentication check completed in ${elapsed}ms`);
      } catch (error) {
        // FIX #6: Timeout or other errors - assume not authenticated and continue
        console.error("[AuthContext] Authentication check failed or timed out:", error);
        // FIX #2: On timeout/error, assume not authenticated - this is safe default
        setUserToken(null);
        setUserInfo(null);
      } finally {
        // FIX #3: CRITICAL - Always set isLoading to false, even if token is missing
        // This ensures the app never gets stuck on loading screen
        setIsLoading(false);
        hasInitializedRef.current = true;
        isCheckingRef.current = false;
        console.log("[AuthContext] Loading state set to false - app can proceed");
      }
    };

    checkAuthentication();
    
    // Cleanup function to reset ref if component unmounts
    return () => {
      isCheckingRef.current = false;
    };
  }, []); // Empty deps - only run once on mount

  const login = async (user: UserInfo, token: string) => {
    try {
      await setItem("token", token);
      await setItem("user", JSON.stringify(user));
      setUserToken({ token });
      setUserInfo(user);
    } catch (error) {
      console.error("[AuthContext] Error during login:", error);
      throw error; // Re-throw so caller can handle
    }
  };
  
  const setUserInformation = async (userInfo: any) => {
    try {
      await setItem("user", JSON.stringify(userInfo));
      setUserInfo(userInfo);
    } catch (error) {
      // FIX #7: Log but don't throw - non-critical operation
      console.warn("[AuthContext] Error updating user info:", error);
    }
  };

  const logout = async () => {
    try {
      await deleteItem("token");
      await deleteItem("user");
      setUserToken(null);
      setUserInfo(null);
    } catch (error) {
      // FIX #7: Even if deletion fails, clear state - user is logged out
      console.warn("[AuthContext] Error during logout:", error);
      setUserToken(null);
      setUserInfo(null);
    }
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
