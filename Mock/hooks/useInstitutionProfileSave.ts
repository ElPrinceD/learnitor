import { useCallback, useState } from "react";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";
import ApiUrl from "../config";
import { useAuth } from "../components/AuthContext";
import type { Address, UserInfo } from "../store/authStore";
import type { Institution } from "../services/SignupApiCalls";
import { getCurrentInstitutionId } from "../utils/leaderboardProfile";

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

  if (institution.id !== currentInstitutionId) {
    if (typeof user?.institution === "number") {
      fields.institution = institution.id;
    } else {
      fields.institution_id = institution.id;
    }
  }

  if (institution.country) {
    const currentCountry = user?.address?.country?.trim() ?? "";
    if (institution.country !== currentCountry) {
      fields.address = buildAddressPayload(user?.address, institution.country);
    }
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

export function useInstitutionProfileSave() {
  const { userInfo, userToken, setUserInformation, setUserInfo } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveInstitution = useCallback(
    async (institution: Institution): Promise<SaveInstitutionResult> => {
      setError(null);

      if (!userInfo?.user.id || !userToken?.token) {
        return { ok: false, reason: "unauthorized" };
      }

      const updatedFields = buildInstitutionUpdateFields(
        userInfo.user,
        institution
      );

      if (Object.keys(updatedFields).length === 0) {
        return { ok: false, reason: "no_changes" };
      }

      setLoading(true);
      try {
        const response = await axios.patch(
          `${ApiUrl}/api/update/user/${userInfo.user.id}/`,
          updatedFields,
          {
            headers: { Authorization: `Token ${userToken.token}` },
          }
        );

        const updated = mergeUserFromPatchResponse(
          userInfo,
          response.data,
          updatedFields,
          institution
        );
        setUserInformation(updated);
        setUserInfo(updated);
        await invalidateLeaderboardProfileQueries(queryClient);

        return { ok: true };
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { detail?: string } } })?.response?.data
            ?.detail ?? "Could not save your school. Please try again.";
        setError(message);
        return { ok: false, reason: "error", message };
      } finally {
        setLoading(false);
      }
    },
    [
      queryClient,
      setUserInfo,
      setUserInformation,
      userInfo,
      userToken?.token,
    ]
  );

  return { saveInstitution, loading, error, clearError: () => setError(null) };
}
