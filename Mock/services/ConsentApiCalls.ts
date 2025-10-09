import axios from 'axios';
import ApiUrl from '../config';

const apiClient = axios.create({
    baseURL: ApiUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface ConsentItem {
    id: number;
    consent_type: string;
    consent_type_display: string;
    granted: boolean;
    granted_at: string | null;
    revoked_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface ConsentResponse {
    consents: Record<string, boolean>;
}

// {GET APIs}

export const getConsents = async (token: string | null | undefined): Promise<ConsentResponse> => {
    try {
        const response = await apiClient.get('/consents/', {
            headers: {
                Authorization: `Token ${token}`,
            },
        });
        
        // Transform array response to object format
        const consentItems: ConsentItem[] = response.data || [];
        const consents: Record<string, boolean> = {};
        
        consentItems.forEach(item => {
            consents[item.consent_type] = item.granted;
        });
        
        return { consents };
    } catch (error) {
        console.error('Error fetching consents:', error);
        throw error;
    }
};

// {POST APIs}

export const updateConsent = async (
    consentType: string,
    granted: boolean,
    token: string | null | undefined
): Promise<ConsentResponse> => {
    try {
        // Send the consent update in the format the backend expects
        const response = await apiClient.post('/consents/', {
            [consentType]: granted,
        }, {
            headers: {
                Authorization: `Token ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error updating consent:', error);
        throw error;
    }
};

// {DELETE APIs}

export const deleteConsents = async (token: string | null | undefined): Promise<void> => {
    try {
        await apiClient.delete('/consents/', {
            headers: {
                Authorization: `Token ${token}`,
            },
        });
    } catch (error) {
        console.error('Error deleting consents:', error);
        throw error;
    }
};