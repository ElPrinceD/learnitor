import axios from 'axios';
import ApiUrl from './config'; // Assuming you have a config file for API URL

const apiClient = axios.create({
    baseURL: ApiUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

const ANNOUNCEMENT_API_BASE_URL = '/announcements/';

// { GET APIs }

/**
 * Fetch all announcements
 */
export const getAnnouncements = async (token) => {
    try {
        const response = await apiClient.get(ANNOUNCEMENT_API_BASE_URL, {
        
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching announcements:', error);
        throw error;
    }
};

