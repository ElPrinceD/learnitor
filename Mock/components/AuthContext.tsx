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
    profile_picture: string;
  };
}

interface AuthContextType {
  userToken: UserToken | null;
  userInfo: UserInfo | null;
  login: (user: UserInfo, token: string) => Promise<void>;
  logout: () => Promise<void>;
  setUserInfo: (userInfo: UserInfo) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getItem = async (key: string) => {
  if (Platform.OS === "web") {
    return await AsyncStorage.getItem(key);
  } else {
    return await SecureStore.getItemAsync(key);
  }
};

const setItem = async (key: string, value: string) => {
  if (Platform.OS === "web") {
    return await AsyncStorage.setItem(key, value);
  } else {
    return await SecureStore.setItemAsync(key, value);
  }
};

const deleteItem = async (key: string) => {
  if (Platform.OS === "web") {
    return await AsyncStorage.removeItem(key);
  } else {
    return await SecureStore.deleteItemAsync(key);
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
      const token = await getItem("token");
      const user = await getItem("user");

      console.log("Token received:", token);
      console.log("User received:", user);

      if (token && user) {
        setUserToken({ token });
        setUserInfo(JSON.parse(user));
      } else {
        setUserToken(null);
        setUserInfo(null);
      }

      setIsLoading(false);
    };

    checkAuthentication();
  }, []);

  const login = async (user: UserInfo, token: string) => {
    await setItem("token", token);
    await setItem("user", JSON.stringify(user));

    console.log("Token stored:", token);
    console.log("User stored:", user);

    setUserToken({ token });
    setUserInfo(user);
  };

  const logout = async () => {
    await deleteItem("token");
    await deleteItem("user");

    setUserToken(null);
    setUserInfo(null);
  };

  return (
    <AuthContext.Provider
      value={{ userInfo, userToken, login, logout, setUserInfo, isLoading }}
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
