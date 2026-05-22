import { useCallback, useEffect, useRef } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import debounce from "lodash.debounce";
import type { Institution } from "../services/SignupApiCalls";

/** Device-local signup draft; cleared after successful registration or login. */
const DRAFT_KEY = "@learnitor/signup_draft_v1";
const PASSWORD_KEY = "@learnitor/signup_draft_password";
const DRAFT_VERSION = 1 as const;
const TTL_MS = 7 * 24 * 60 * 60 * 1000;
const DEBOUNCE_MS = 500;

export type SignupStep = 1 | 2 | 3;

export type SignupDraft = {
  version: typeof DRAFT_VERSION;
  step: SignupStep;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  institution: Institution | null;
  updatedAt: number;
};

export type SignupDraftSnapshot = {
  step: SignupStep;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  username: string;
  institution: Institution | null;
};

function clampStep(snapshot: SignupDraftSnapshot): SignupStep {
  const hasAccount =
    snapshot.firstName.trim() &&
    snapshot.lastName.trim() &&
    snapshot.email.includes("@") &&
    snapshot.password.length >= 8;
  const hasUsername = snapshot.username.trim().length >= 3;
  const hasSchool = snapshot.institution != null;

  let step = snapshot.step;
  if (step >= 3 && (!hasUsername || !hasSchool)) step = hasUsername ? 2 : 1;
  if (step >= 2 && !hasUsername) step = 1;
  if (step >= 2 && !hasAccount) step = 1;
  if (step === 3 && !hasSchool) step = 2;
  return step;
}

function draftEquals(a: SignupDraft, b: SignupDraft): boolean {
  return (
    a.step === b.step &&
    a.firstName === b.firstName &&
    a.lastName === b.lastName &&
    a.email === b.email &&
    a.username === b.username &&
    (a.institution?.id ?? null) === (b.institution?.id ?? null)
  );
}

async function readPassword(): Promise<string> {
  if (Platform.OS === "web") return "";
  try {
    return (await SecureStore.getItemAsync(PASSWORD_KEY)) ?? "";
  } catch {
    return "";
  }
}

async function writePassword(password: string): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    if (password) {
      await SecureStore.setItemAsync(PASSWORD_KEY, password);
    } else {
      await SecureStore.deleteItemAsync(PASSWORD_KEY);
    }
  } catch {
    // ignore secure store errors
  }
}

export async function loadSignupDraft(): Promise<{
  snapshot: SignupDraftSnapshot | null;
  hadDraft: boolean;
}> {
  try {
    const raw = await AsyncStorage.getItem(DRAFT_KEY);
    if (!raw) return { snapshot: null, hadDraft: false };

    const parsed = JSON.parse(raw) as SignupDraft;
    if (parsed.version !== DRAFT_VERSION) {
      await clearSignupDraft();
      return { snapshot: null, hadDraft: false };
    }

    if (Date.now() - parsed.updatedAt > TTL_MS) {
      await clearSignupDraft();
      return { snapshot: null, hadDraft: false };
    }

    const password = await readPassword();
    const snapshot: SignupDraftSnapshot = {
      step: parsed.step,
      firstName: parsed.firstName ?? "",
      lastName: parsed.lastName ?? "",
      email: parsed.email ?? "",
      username: parsed.username ?? "",
      institution: parsed.institution ?? null,
      password,
    };
    snapshot.step = clampStep(snapshot);

    const hasAnyField =
      snapshot.step > 1 ||
      !!snapshot.firstName ||
      !!snapshot.lastName ||
      !!snapshot.email ||
      !!snapshot.username ||
      !!snapshot.institution;

    return { snapshot, hadDraft: hasAnyField };
  } catch {
    return { snapshot: null, hadDraft: false };
  }
}

export async function saveSignupDraft(
  snapshot: SignupDraftSnapshot
): Promise<void> {
  const draft: SignupDraft = {
    version: DRAFT_VERSION,
    step: snapshot.step,
    firstName: snapshot.firstName,
    lastName: snapshot.lastName,
    email: snapshot.email,
    username: snapshot.username,
    institution: snapshot.institution,
    updatedAt: Date.now(),
  };

  try {
    const existing = await AsyncStorage.getItem(DRAFT_KEY);
    if (existing) {
      const prev = JSON.parse(existing) as SignupDraft;
      if (draftEquals(prev, draft)) {
        await writePassword(snapshot.password);
        return;
      }
    }
    await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    await writePassword(snapshot.password);
  } catch {
    // ignore persistence errors
  }
}

export async function clearSignupDraft(): Promise<void> {
  try {
    await AsyncStorage.removeItem(DRAFT_KEY);
    if (Platform.OS !== "web") {
      await SecureStore.deleteItemAsync(PASSWORD_KEY);
    }
  } catch {
    // ignore
  }
}

export function useSignupDraftPersistence(
  snapshot: SignupDraftSnapshot,
  options: { enabled: boolean; isHydrating: boolean }
) {
  const lastSavedRef = useRef<string>("");
  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;

  const flushSave = useCallback(async () => {
    if (!options.enabled || options.isHydrating) return;
    const s = snapshotRef.current;
    const key = JSON.stringify({
      step: s.step,
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.email,
      username: s.username,
      institutionId: s.institution?.id ?? null,
    });
    if (key === lastSavedRef.current) return;
    lastSavedRef.current = key;
    await saveSignupDraft(s);
  }, [options.enabled, options.isHydrating]);

  const debouncedSave = useRef(
    debounce(() => {
      flushSave();
    }, DEBOUNCE_MS)
  ).current;

  useEffect(() => {
    if (!options.enabled || options.isHydrating) return;
    debouncedSave();
    return () => debouncedSave.cancel();
  }, [
    snapshot.step,
    snapshot.firstName,
    snapshot.lastName,
    snapshot.email,
    snapshot.password,
    snapshot.username,
    snapshot.institution?.id,
    options.enabled,
    options.isHydrating,
    debouncedSave,
  ]);

  const flushNow = useCallback(() => {
    debouncedSave.cancel();
    return flushSave();
  }, [debouncedSave, flushSave]);

  return { flushNow };
}
