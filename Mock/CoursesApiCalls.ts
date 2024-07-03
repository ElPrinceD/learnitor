import axios from 'axios';
import ApiUrl from './config'; // Assuming you have a config file for API URL

const apiClient = axios.create({
    baseURL: ApiUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});



export const getCourses = async (token) => {

try {
 const response = await apiClient.get('/api/course/all/', {
      headers: {
                Authorization: `Token ${token}`,
            },
 });
     return  response.data ;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};
    
export const getCourseCategories = async (token) => {
  
  try {
    const response = await apiClient.get('/api/category/all/', {
     headers: {
                Authorization: `Token ${token}`,
            },
    });
    return  response.data ;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

export const getRecommendedCourses = async (token) => {

    try {
        const response = await apiClient.get('/api/course/all/', {
            headers: {
                Authorization: `Token ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching recommended courses:', error);
        throw error;
    }
};

export const getEnrolledCourses = async (userId, token) => {
    try {
        const response = await apiClient.get(`/api/learner/${userId}/courses`, {
            headers: {
                Authorization: `Token ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching enrolled courses:', error);
        throw error;
    }
};

export const getCourseTopics = async (courseId, token) => {
    try {
        const response = await apiClient.get(`/api/course/${courseId}/topics/`, {
            headers: {
                Authorization: `Token ${token}`,
            },
        });

        return response.data;

    } catch (error) {
        console.error('Error fetching course topics:', error);
        throw error;
    }
    
};

export const getEnrollmentStatus = async (userId, courseId, token) => {
    try {
        const response = await apiClient.get(`/api/learner/${userId}/course/${courseId}/enrollment/`, {
            headers: {
                Authorization: `Token ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching enrollment status:', error);
        throw error;
    }
};

export const enrollInCourse = async (userId, courseId, topicIds, token) => {
    try {
        const response = await apiClient.post(`/api/learner/${userId}/course/${courseId}/enroll/`, {
            selectedTopics: topicIds,
        }, {
            headers: {
                Authorization: `Token ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error enrolling in course:', error);
        throw error;
    }
};

export const unenrollFromCourse = async (userId, courseId, token) => {
    try {
        const response = await apiClient.post(`/api/learner/${userId}/course/${courseId}/unenroll/`, {}, {
            headers: {
                Authorization: `Token ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error unenrolling from course:', error);
        throw error;
    }
};

export const getCourseProgress = async (userId, courseId, token) => {
    try {
        const response = await apiClient.get(`/api/learner/${userId}/course/${courseId}/progress/`, {
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

