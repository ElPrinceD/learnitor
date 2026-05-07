import axios from 'axios';
import ApiUrl from '../config';
import { Question } from '../components/types';

const apiClient = axios.create({
  baseURL: ApiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface WeeklyExamStatus {
  isActive: boolean;
  hasCompleted: boolean;
  startsAt: string;
  endsAt: string;
  currentWeek?: number;
  seasonName?: string;
  globalAverage?: number;
  userScore?: number | null;
}

export interface WeeklyExamQuestionsResponse {
  questions: Question[];
}

export interface WeeklyExamSubmitData {
  finalScore: number;
  highestStreak: number;
}

export interface WeeklyExamSubmitResponse {
  success: boolean;
  weeklyRank?: number;
  h2hResult?: {
    opponentName: string;
    opponentScore: number;
    result: "won" | "lost" | "draw";
  };
}

export const getWeeklyExamStatus = async (token: string | null | undefined): Promise<WeeklyExamStatus> => {
  const response = await apiClient.get<WeeklyExamStatus>('/api/weekly-exam/status', {
    headers: { Authorization: `Token ${token}` },
  });
  return response.data;
};

export const getWeeklyExamQuestions = async (token: string | null | undefined): Promise<WeeklyExamQuestionsResponse> => {
  const response = await apiClient.get<WeeklyExamQuestionsResponse>('/api/weekly-exam/questions', {
    headers: { Authorization: `Token ${token}` },
  });
  return response.data;
};

export const submitWeeklyExam = async (
  token: string | null | undefined,
  data: WeeklyExamSubmitData
): Promise<WeeklyExamSubmitResponse> => {
  const response = await apiClient.post<WeeklyExamSubmitResponse>(
    '/api/weekly-exam/submit',
    data,
    { headers: { Authorization: `Token ${token}` } }
  );
  return response.data;
};
