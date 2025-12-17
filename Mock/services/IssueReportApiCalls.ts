import axios from "axios";
import apiUrl from "../config";

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: apiUrl,
  timeout: 15000, // 15 second timeout
});

// Generic response handler
const handleApiResponse = <T>(response: any): T => {
  if (response.status >= 200 && response.status < 300) {
    return response.data;
  }
  throw new Error(`API request failed with status ${response.status}`);
};

// Client-side Issue Report API calls (for customers only)
export const createIssueReport = async (
  issueData: {
    title: string;
    description: string;
    category: string;
    priority: string;
    steps_to_reproduce?: string;
    expected_behavior?: string;
    actual_behavior?: string;
    environment?: string;
    device_info?: string;
    contact_method?: string;
    contact_info?: string;
  },
  token: string | null | undefined
) => {
  try {
    const response = await apiClient.post("/issue-reports/", issueData, {
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
    });
    return handleApiResponse(response);
  } catch (error) {
    throw error;
  }
};

