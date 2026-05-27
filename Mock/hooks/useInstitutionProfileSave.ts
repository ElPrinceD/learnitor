import { useCallback, useState } from "react";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";
import ApiUrl from "../config";
import { queryClient } from "../QueryClient";
import { useAuth, useAuthStore } from "../store/authStore";
import type { Address, UserInfo } from "../store/authStore";
import {
  getInstitutionById,
  type Institution,
} from "../services/SignupApiCalls";
import {
  getCurrentInstitutionId,
  hasCountryProfile,
} from "../utils/leaderboardProfile";

export const buildAddressPayload = (
  existing: Partial<Address> | undefined,
  countryCode: string
): Address => ({
  street_1: existing?.street_1 ?? "",
  street_2: existing?.street_2 ?? "",
  city: existing?.city ?? "",
  region: existing?.region ?? "",
  country: countryCode,
});

export const buildInstitutionUpdateFields = (
  user: UserInfo["user"] | undefined,
  institution: Institution
): Record<string, unknown> => {
  const fields: Record<string, unknown> = {};
  const currentInstitutionId = getCurrentInstitutionId(user);
  const institutionChanged = institution.id !== currentInstitutionId;
  const countryCode = institution.country?.trim() ?? "";
  const currentCountry = user?.address?.country?.trim() ?? "";
  const needsCountryBackfill =
    !!countryCode && countryCode !== currentCountry;

  if (institutionChanged) {
    // Send both keys so backend + local auth never drift (institution vs institution_id).
    fields.institution = institution.id;
    fields.institution_id = institution.id;
  }

  if (needsCountryBackfill) {
    fields.address = buildAddressPayload(user?.address, countryCode);
  }

  return fields;
};

export const mergeUserFromPatchResponse = (
  userInfo: UserInfo,
  responseData: unknown,
  updatedFields: Record<string, unknown>,
  selectedInstitution?: Institution | null
): UserInfo => {
  const serverUserPayload =
    (responseData as { user?: Record<string, unknown> } | undefined)?.user ??
    (responseData as Record<string, unknown> | undefined) ??
    {};

  const institutionId =
    (serverUserPayload.institution as number | undefined) ??
    (serverUserPayload.institution_id as number | undefined) ??
    (updatedFields.institution as number | undefined) ??
    (updatedFields.institution_id as number | undefined) ??
    selectedInstitution?.id;

  const mergedAddress =
    (serverUserPayload.address as Address | undefined) ??
    (updatedFields.address as Address | undefined) ??
    userInfo.user.address;

  const updatedUser = {
    ...userInfo.user,
    ...updatedFields,
    ...serverUserPayload,
    ...(institutionId != null
      ? {
          institution: institutionId,
          institution_id: institutionId,
        }
      : {}),
    ...(mergedAddress ? { address: mergedAddress } : {}),
  };

  return { ...userInfo, user: updatedUser };
};

export const invalidateLeaderboardProfileQueries = async (
  queryClient: ReturnType<typeof useQueryClient>
) => {
  await queryClient.invalidateQueries({ queryKey: ["leaderboardDetails"] });
  await queryClient.invalidateQueries({ queryKey: ["rankingsSummary"] });
};

export type SaveInstitutionResult =
  | { ok: true }
  | { ok: false; reason: "no_changes" | "unauthorized" | "error"; message?: string };

/**
 * Legacy users may have institution set but no address.country.
 * Looks up their current school and PATCHes country when available.
 */
export const attemptCountryBackfillFromSchool = async (): Promise<boolean> => {
  const liveUserInfo = useAuthStore.getState().userInfo;
  const liveToken = useAuthStore.getState().userToken?.token;

  if (!liveUserInfo?.user.id || !liveToken) {
    return false;
  }

  if (hasCountryProfile(liveUserInfo.user)) {
    return true;
  }

  const institutionId = getCurrentInstitutionId(liveUserInfo.user);
  if (!institutionId) {
    return false;
  }

  const institution = await getInstitutionById(institutionId);
  if (!institution?.country?.trim()) {
    return false;
  }

  const updatedFields = buildInstitutionUpdateFields(
    liveUserInfo.user,
    institution
  );

  if (Object.keys(updatedFields).length === 0) {
    return false;
  }

  try {
    const response = await axios.patch(
      `${ApiUrl}/api/update/user/${liveUserInfo.user.id}/`,
      updatedFields,
      {
        headers: { Authorization: `Token ${liveToken}` },
      }
    );

    const updated = mergeUserFromPatchResponse(
      liveUserInfo,
      response.data,
      updatedFields,
      institution
    );
    await useAuthStore.getState().setUserInformation(updated);
    await invalidateLeaderboardProfileQueries(queryClient);
    return true;
  } catch {
    return false;
  }
};

export function useInstitutionProfileSave() {
  const { setUserInformation } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveInstitution = useCallback(
    async (institution: Institution): Promise<SaveInstitutionResult> => {
      setError(null);

      const liveUserInfo = useAuthStore.getState().userInfo;
      const liveToken = useAuthStore.getState().userToken?.token;

      if (!liveUserInfo?.user.id || !liveToken) {
        return { ok: false, reason: "unauthorized" };
      }

      const updatedFields = buildInstitutionUpdateFields(
        liveUserInfo.user,
        institution
      );

      if (Object.keys(updatedFields).length === 0) {
        return { ok: false, reason: "no_changes" };
      }

      setLoading(true);
      try {
        const response = await axios.patch(
          `${ApiUrl}/api/update/user/${liveUserInfo.user.id}/`,
          updatedFields,
          {
            headers: { Authorization: `Token ${liveToken}` },
          }
        );

        const updated = mergeUserFromPatchResponse(
          liveUserInfo,
          response.data,
          updatedFields,
          institution
        );
        await setUserInformation(updated);
        await invalidateLeaderboardProfileQueries(queryClient);

        return { ok: true };
      } catch (err: unknown) {
        const data = (err as { response?: { data?: Record<string, unknown> } })
          ?.response?.data;
        const message =
          (typeof data?.detail === "string" ? data.detail : null) ??
          (typeof data?.message === "string" ? data.message : null) ??
          "Could not save your school. Please try again.";
        setError(message);
        return { ok: false, reason: "error", message };
      } finally {
        setLoading(false);
      }
    },
    [queryClient, setUserInformation]
  );

  return { saveInstitution, loading, error, clearError: () => setError(null) };
}
