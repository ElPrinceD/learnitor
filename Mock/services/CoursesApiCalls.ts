import axios from 'axios';
import ApiUrl from '../config'; // Assuming you have a config file for API URL
import { Answer, Question, Topic, Course } from '../components/types'; // Import Course type

const apiClient = axios.create({
    baseURL: ApiUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

interface ApiResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T;
}

const handleApiResponse = <T>(response: any): T => {
    if (response?.data?.results !== undefined) {
        // It looks like a paginated response
        return response.data.results as T;
    }
    // Otherwise, return the entire data
    return response.data as T;
};

export const api = {
    get: async <T>(url: string, config?: any): Promise<T> => {
        try {
            const response = await apiClient.get(url, config);
            return handleApiResponse<T>(response);
        } catch (error) {
            console.error(`API GET request to ${url} failed:`, error);
            throw error;
        }
    },

    post: async <T>(url: string, data?: any, config?: any): Promise<T> => {
        try {
            const response = await apiClient.post(url, data, config);
            return handleApiResponse<T>(response);
        } catch (error) {
            console.error(`API POST request to ${url} failed:`, error);
            throw error;
        }
    },

    put: async <T>(url: string, data?: any, config?: any): Promise<T> => {
        try {
            const response = await apiClient.put(url, data, config);
            return handleApiResponse<T>(response);
        } catch (error) {
            console.error(`API PUT request to ${url} failed:`, error);
            throw error;
        }
    },

    delete: async <T>(url: string, config?: any): Promise<T> => {
        try {
            const response = await apiClient.delete(url, config);
            return handleApiResponse<T>(response);
        } catch (error) {
            console.error(`API DELETE request to ${url} failed:`, error);
            throw error;
        }
    },
    // Add other HTTP methods (patch, etc.) if needed
};



const LEARNER_API_BASE_URL = '/api/learner';

// {GET APIs}

export const getCourses = async (token: string): Promise<Course[]> => {
    try {
        const data = await api.get<Course[]>('/api/courses/', {
            headers: {
                Authorization: `Token ${token}`,
            },
        });
        return data;
    } catch (error) {
        console.error('Error fetching courses:', error);
        throw error;
    }
};

export const getCourseCategories = async (token: string): Promise<any[]> => { // Change any[] to the correct type if you have it
    try {
        const data = await api.get<any[]>('/api/categories/', { // Change any[]
            headers: {
                Authorization: `Token ${token}`,
            },
        });
        return data;
    } catch (error) {
        console.error('Error fetching categories:', error);
        throw error;
    }
};

export const getRecommendedCourses = async (token: string, categoryId: number): Promise<Course[]> => {
    try {
        const data = await api.get<Course[]>(`/api/courses/?category_id=${categoryId}`, {
            headers: {
                Authorization: `Token ${token}`,
            },
        });
        return data;
    } catch (error) {
        console.error('Error fetching recommended courses:', error);
        throw error;
    }
};

export const getEnrolledCourses = async (userId: number, token: string): Promise<Course[]> => {
    try {
        const data = await api.get<Course[]>(`${LEARNER_API_BASE_URL}/${userId}/courses`, {
            headers: {
                Authorization: `Token ${token}`,
            },
        });
        return data;
    } catch (error) {
        console.error('Error fetching enrolled courses:', error);
        throw error;
    }
};

export const getCourseTopics = async (courseId: number, token: string): Promise<Topic[]> => {
    try {
        const data = await api.get<Topic[]>(`/api/topics/?course_id=${courseId}`, {
            headers: {
                Authorization: `Token ${token}`,
            },
        });
        return data;
    } catch (error) {
        console.error('Error fetching course topics:', error);
        throw error;
    }
};

export const getEnrollmentStatus = async (userId: number, courseId: number, token: string): Promise<any> => { // replace any
    console.log(`${LEARNER_API_BASE_URL}/${userId}/course/${courseId}/enrollment/`);
    try {
        const data = await api.get<any>(`${LEARNER_API_BASE_URL}/${userId}/course/${courseId}/enrollment/`, { // replace any
            headers: {
                Authorization: `Token ${token}`,
            },
        });
        return data;
    } catch (error) {
        console.error('Error fetching enrollment status:', error);
        throw error;
    }
};

export const getCourseProgress = async (userId: number, courseId: number, token: string): Promise<number> => {
    try {
        const response = await apiClient.get(`${LEARNER_API_BASE_URL}/${userId}/course/${courseId}/progress/`, {
            headers: {
                Authorization: `Token ${token}`,
            },
        });
        return response.data.course_progress;
    } catch (error) {
        console.error('Error fetching course progress:', error);
        throw error;
    }
};

export const getEnrolledCourseTopics = async (userId: number, courseId: number, token: string): Promise<Topic[]> => {
    try {
        const data = await api.get<Topic[]>(`${LEARNER_API_BASE_URL}/${userId}/course/${courseId}/topics/`,
            {
                headers: {
                    Authorization: `Token ${token}`,
                },
            }
        );
        return data;
    } catch (error) {
        console.error('Error fetching enrolled topics:', error);
        throw error;
    }
};

export const getPracticeQuestions = async (topicId: number, token: string, level: string = "all"): Promise<Question[]> => {
    try {
        const data = await api.get<Question[]>(`/api/questions/?topic_id=${topicId}`, {
            headers: {
                Authorization: `Token ${token}`,
            },
        });
        return data.filter((question) => level === "all" || question.level === level);
    } catch (error) {
        console.error('Error fetching practice questions:', error);
        throw error;
    }
};

export const getPracticeAnswers = async (questionId: number, token: string): Promise<Answer[]> => {
    try {
        const data = await api.get<Answer[]>(`/api/answers/?question_id=${questionId}`,
            {
                headers: {
                    Authorization: `Token ${token}`,
                },
            }
        );
        return data;
    } catch (error) {
        console.error('Error fetching practice answers:', error);
        throw error;
    }
};

export const fetchTopicMaterials = async (topicId: number, token: string): Promise<any[]> => { // Change any[]
    try {

        const data = await api.get<any[]>(`/api/materials/?topic_id=${topicId}`, {  // Change any[]
            headers: {
                Authorization: `Token ${token}`,
            },
        });
        return data;
    }
    catch (error) {
        console.error('Error fetching materials:', error);
        throw error;
    }
};

// {POST APIs}

export const enrollInCourse = async (userId: number, courseId: number, topicIds: number[], token: string): Promise<any> => {  // replace any
    try {
        const data = await api.post<any>(`${LEARNER_API_BASE_URL}/${userId}/course/${courseId}/enroll/`, { // replace any
            selectedTopics: topicIds,
        }, {
            headers: {
                Authorization: `Token ${token}`,
            },
        });
        console.log(data.results)
        return data;
    } catch (error) {
        console.error('Error enrolling in course:', error);
        throw error;
    }
};

export const unenrollFromCourse = async (userId: number, courseId: number, token: string): Promise<any> => { // replace any
    try {
        const data = await api.post<any>(`${LEARNER_API_BASE_URL}/${userId}/course/${courseId}/unenroll/`, {}, { // replace any
            headers: {
                Authorization: `Token ${token}`,
            },
        });
        return data;
    } catch (error) {
        console.error('Error unenrolling from course:', error);
        throw error;
    }
};


export const markTopicAsComplete = async (userId: number, courseId: number, topicId: number, token: string): Promise<any> => { // replace any
    try {
        const data = await api.post<any>(
            `${LEARNER_API_BASE_URL}/${userId}/course/${courseId}/topic/${topicId}/mark-completed/`,
            {},
            {
                headers: {
                    Authorization: `Token ${token}`,
                },
            }
        );
        return data;
    } catch (error) {
        console.error('Error marking topic completed:', error);
        throw error;
    }
};

