import axios from "axios";
import ApiUrl from "../config";

const apiClient = axios.create({
  baseURL: ApiUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface Institution {
  id: number;
  name: string;
  city?: string;
  country?: string;
}

export interface InstitutionsListResponse {
  results: Institution[];
  count: number;
  next: string | null;
}

export interface UsernameCheckResponse {
  username: string;
  available: boolean;
  reason?: "taken" | "invalid";
}

export interface RegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  username: string;
  institution_id: number;
}

export interface RegisterUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  username?: string;
  institution_id?: number;
  token?: string;
  [key: string]: unknown;
}

export interface RegisterResponse {
  user: RegisterUser;
}

/** Featured schools when q is empty; search when q.length >= 2 */
export const searchInstitutions = async (
  q: string,
  limit = 30,
  offset = 0,
  signal?: AbortSignal
): Promise<InstitutionsListResponse> => {
  const params: Record<string, string | number> = { limit, offset };
  const trimmed = q.trim();
  if (trimmed.length >= 2) {
    params.q = trimmed;
  }

  const response = await apiClient.get<InstitutionsListResponse>(
    "/api/institutions/",
    { params, signal }
  );
  return response.data;
};

export const checkUsernameAvailable = async (
  username: string,
  signal?: AbortSignal
): Promise<UsernameCheckResponse> => {
  const response = await apiClient.get<UsernameCheckResponse>(
    "/api/auth/username/check/",
    { params: { username: username.trim() }, signal }
  );
  return response.data;
};

export const registerUser = async (
  payload: RegisterPayload
): Promise<RegisterResponse> => {
  const response = await apiClient.post<RegisterResponse>(
    "/api/register/",
    payload
  );
  return response.data;
};
