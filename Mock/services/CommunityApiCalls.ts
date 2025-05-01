import axios from 'axios';
import ApiUrl from '../config';
import { api } from './CoursesApiCalls';

const apiClient = axios.create({
    baseURL: ApiUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

const COMMUNITY_API_BASE_URL = '/api/communities';
const MESSAGE_API_BASE_URL = '/api/messages';

export const getCommunities = async (token: string) => {
    try {
        const response = await apiClient.get(`${COMMUNITY_API_BASE_URL}/`, {
            headers: {
                "ngrok-skip-browser-warning": "69420",
                Authorization: `Token ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching communities:', error);
        throw error;
    }
};

export const searchCommunities = async (searchQuery: string, token: string) => {
    try {
        const response = await apiClient.get(`${COMMUNITY_API_BASE_URL}/?search=${encodeURIComponent(searchQuery)}`, {
            headers: {
                "ngrok-skip-browser-warning": "69420",
                Authorization: `Token ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error searching communities:', error);
        throw error;
    }
};

export const getCommunityDetails = async (communityId: string | number, token: any) => {
    try {
        const response = await apiClient.get(`${COMMUNITY_API_BASE_URL}/${communityId}/`, {
            headers: {
                Authorization: `Token ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching community details:', error);
        throw error;
    }
};

export const getCommunityTimetable = async (communityId: string, token: string) => {
    
    try {
        const response = await apiClient.get(`api/timetables/community/${communityId}/`, {
            headers: {
                Authorization: `Token ${token}`,
            },
        });
        return response.data.results;
    } catch (error) {
        console.error('Error fetching community timetable:', error);
        throw error;
    }
};

export const updateCommunity = async (communityId: string, communityData: any, token: string | null) => {
    console.log(communityId);
    console.log(communityData);
    try {
        const response = await apiClient.patch(`${COMMUNITY_API_BASE_URL}/${communityId}/`, communityData, {
            headers: {
                Authorization: `Token ${token}`,
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error updating community:', error);
        throw error;
    }
};

export const getCommunityMessages = async (
    communityId: string,
    token: string,
    pageSize: number = 50,
    beforeMessageId?: string,
    beforeTimestamp?: string
) => {
    try {
        // Construct query parameters
        const params: any = { page_size: pageSize };
        if (beforeMessageId) params.before_message_id = beforeMessageId;
        if (beforeTimestamp) params.before_timestamp = beforeTimestamp;

        const response = await apiClient.get(`${MESSAGE_API_BASE_URL}/${communityId}/get_messages/`, {
            headers: {
                Authorization: `Token ${token}`,
            },
            params, // Pass query parameters
        });
        
        return response.data;
    } catch (error) {
        console.error('Error fetching community messages:', error);
        throw error;
    }
};

export const getUserCommunities = async (token: string) => {
    try {
        const response = await apiClient.get(`${COMMUNITY_API_BASE_URL}/user_communities/`, {
            headers: {
                Authorization: `Token ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching user communities:', error);
        throw error;
    }
};

export const removeCommunityMember = async (
    communityId: string | number,
    userId: string | number,
    token: string
) => {
    try {
        const response = await apiClient.post(
            `${COMMUNITY_API_BASE_URL}/${communityId}/remove_member/`,
            { user_id: userId },
            {
                headers: {
                    Authorization: `Token ${token}`,
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error removing community member:', error);
        throw error;
    }
};

export const shareCommunity = async (communityId: string, token: string) => {
    console.log(communityId, token);
    try {
        const response = await apiClient.get(`${COMMUNITY_API_BASE_URL}/${communityId}/share/`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching share details', error);
        throw error;
    }
};

export const joinCommunity = async (communityId: number, token: string) => {
    try {
        const response = await apiClient.post(`${COMMUNITY_API_BASE_URL}/${communityId}/join/`, {}, {
            headers: {
                Authorization: `Token ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error joining community:', error);
        throw error;
    }
};

export const leaveCommunity = async (communityId: string, token: any) => {
    try {
        const response = await apiClient.post(`${COMMUNITY_API_BASE_URL}/${communityId}/leave/`, {}, {
            headers: {
                Authorization: `Token ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error leaving community:', error);
        throw error;
    }
};

export const getLastMessages = async (token: string) => {
    try {
        const response = await apiClient.get(`${MESSAGE_API_BASE_URL}/last_messages/`, {
            headers: {
                Authorization: `Token ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching last messages:', error);
        throw error;
    }
};

export const sendMessageToCommunity = async (communityId: number, message: string, token: string) => {
    try {
        const response = await apiClient.post(`${COMMUNITY_API_BASE_URL}/${communityId}/messages/`, { message }, {
            headers: {
                Authorization: `Token ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error sending message to community:', error);
        throw error;
    }
};

export const createCommunity = async (communityData: any, token: string) => {
    console.log('Community: ', communityData);
    try {
        const response = await apiClient.post(`${COMMUNITY_API_BASE_URL}/`, communityData, {
            headers: {
                Authorization: `Token ${token}`,
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error creating community:', error);
        throw error;
    }
};