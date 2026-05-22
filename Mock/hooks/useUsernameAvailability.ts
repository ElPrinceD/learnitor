import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { checkUsernameAvailable } from "../services/SignupApiCalls";

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;
const DEBOUNCE_MS = 400;

export type UsernameStatus =
  | "idle"
  | "typing"
  | "checking"
  | "available"
  | "taken"
  | "invalid";

export function useUsernameAvailability() {
  const [username, setUsername] = useState("");
  const [debouncedUsername, setDebouncedUsername] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = username.trim();
    if (!trimmed) {
      setDebouncedUsername("");
      return;
    }
    const timer = setTimeout(() => setDebouncedUsername(trimmed), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [username]);

  const isFormatValid = useMemo(
    () => USERNAME_REGEX.test(debouncedUsername),
    [debouncedUsername]
  );

  const canCheck =
    debouncedUsername.length >= 3 && debouncedUsername === username.trim();

  const query = useQuery({
    queryKey: ["username-check", debouncedUsername],
    queryFn: async () => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      return checkUsernameAvailable(
        debouncedUsername,
        abortRef.current.signal
      );
    },
    enabled: canCheck && isFormatValid,
    staleTime: 60_000,
    retry: false,
  });

  const status: UsernameStatus = useMemo(() => {
    const trimmed = username.trim();
    if (!trimmed) return "idle";
    if (trimmed !== debouncedUsername) return "typing";
    if (!USERNAME_REGEX.test(trimmed)) return "invalid";
    if (query.isFetching) return "checking";
    if (query.data?.available === true) return "available";
    if (query.data?.available === false) return "taken";
    if (query.isError) return "taken";
    return "checking";
  }, [username, debouncedUsername, query.isFetching, query.data, query.isError]);

  const errorText = useMemo(() => {
    if (status === "taken") return "Username is already in use";
    if (status === "invalid" && username.trim().length > 0) {
      return "Use 3–30 letters, numbers, or underscores";
    }
    return "";
  }, [status, username]);

  const isAvailable = status === "available";
  const isChecking = status === "checking" || status === "typing";

  const onChangeUsername = useCallback((text: string) => {
    setUsername(text.replace(/\s/g, ""));
  }, []);

  const resetUsernameCheck = useCallback(() => {
    setUsername("");
    setDebouncedUsername("");
  }, []);

  const setUsernameValue = useCallback((value: string) => {
    const cleaned = value.replace(/\s/g, "");
    setUsername(cleaned);
    setDebouncedUsername(cleaned);
  }, []);

  return {
    username,
    onChangeUsername,
    setUsernameValue,
    status,
    errorText,
    isAvailable,
    isChecking,
    resetUsernameCheck,
  };
}
