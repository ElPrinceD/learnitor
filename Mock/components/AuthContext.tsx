import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface UserToken {
  token: string | null;
}
interface UserInfo {
  user: {
    id: number;
    first_name: string;
    last_name: string;
    token: string;
    email: string;
    dob: string;
  };
}

interface AuthContextType {
  userToken: UserToken | null;
  userInfo: UserInfo | null;
  login: (user: UserInfo, token: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean; // Add isLoading state to track authentication status
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [userToken, setUserToken] = useState<UserToken | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Initial loading state

  useEffect(() => {
    const checkAuthentication = async () => {
      const token = await AsyncStorage.getItem("token");
      const user = await AsyncStorage.getItem("user");

      console.log("Token received:", token);
      console.log("User received:", user);

      if (token && user) {
        setUserToken({ token });
        setUserInfo(JSON.parse(user));
      } else {
        setUserToken(null);
        setUserInfo(null);
      }

      setIsLoading(false); // Update loading state after authentication check
    };

    checkAuthentication();
  }, []);

  const login = async (user: UserInfo, token: string) => {
    await AsyncStorage.setItem("token", token);
    await AsyncStorage.setItem("user", JSON.stringify(user));

    console.log("Token stored:", token);
    console.log("User stored:", user);

    setUserToken({ token });
    setUserInfo(user);
  };

  const logout = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");

    setUserToken(null);
    setUserInfo(null);
  };

  return (
    <AuthContext.Provider
      value={{ userInfo, userToken, login, logout, isLoading }}
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
