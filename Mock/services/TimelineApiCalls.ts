import axios from 'axios';
import ApiUrl from '../config'; 

const apiClient = axios.create({
    baseURL: ApiUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});
export const getTodayPlans = async (token: string | null | undefined, date: Date, selectedCategory: string | number | null) => {
  const currentDate = date.toISOString().split('T')[0];
  let apiUrl = `${ApiUrl}/api/learner/tasks/?due_date=${currentDate}`;
  if (selectedCategory !== null) {
    apiUrl += `&category=${selectedCategory}`;
  }
  const response = await axios.get(apiUrl, {
    headers: { Authorization: `Token ${token}` },
  });

  const results = response.data.results || response.data || [];
  return results.sort((a: any, b: any) => {
    const dateA = new Date(`${a.due_date}T${a.due_time}`);
    const dateB = new Date(`${b.due_date}T${b.due_time}`);
    return dateA.getTime() - dateB.getTime();
  });
};


export const cancelPeriodForToday = async (periodId: string | number, token: string | null | undefined) => {
 
  try {
    const response = await apiClient.post(`/periods/${periodId}/cancel/`, {
      date: new Date().toISOString().split('T')[0]
    }, {
      headers: { Authorization: `Token ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};


export const uncancelPeriodForToday = async (periodId: string | number, token: string | null | undefined) => {
  try {
    const response = await apiClient.post(`/periods/${periodId}/uncancel/`, {
      date: new Date().toISOString().split('T')[0]
    }, {
      headers: { Authorization: `Token ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getCategoryNames = async (token: string | null | undefined) => {
    try {
        const response = await apiClient.get('/api/task/categories/', {
            headers: { Authorization: `Token ${token}` },
        });

        
        // Handle different possible response structures
        const categories = response.data.results || response.data || [];
        
        if (!Array.isArray(categories)) {
            return {};
        }
        
        return categories.reduce((acc: any, category: any) => {
            acc[category.id] = category.name;
            return acc;
        }, {})
    
  } catch (error)
  {
    throw error;
  }
};
export const getCategories = async (token: string | null | undefined) => {
       try {

    const response = await apiClient.get('/api/task/categories/', {
      headers: {
        Authorization: `Token ${token}`,
      },
    })
 
    
    // Handle different possible response structures
    const categories = response.data.results || response.data || [];
    
    if (!Array.isArray(categories)) {
        return [];
    }
    
    return categories.map((category: any) => ({
      label: category.name,
      value: category.id,
    }));
          } catch (error)
   {
    throw error;
  }
};
  
export const createTask = async (taskData: any, token: string | null | undefined) => {
  try {
    const response = await apiClient.post('/tasks/', taskData, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateTask = async (taskId: string | number, taskData: any, token: string | null | undefined, updateScope: string = 'single') => {
  let url = `/tasks/${taskId}/`;
  
  // Add query parameter based on update scope
  if (updateScope === 'all') {
    url += '?update=all';
  } else if (updateScope === 'future') {
    url += '?update=future';
  }
  // For 'single' scope, no query parameter is needed
  
  
  try {
    const response = await apiClient.patch(url, taskData, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteTask = async (taskId: string | number, token: string | null | undefined, deleteScope: string = 'single') => {
  let url = `/tasks/${taskId}/`;
  
  // Add query parameter based on delete scope
  if (deleteScope === 'all') {
    url += '?delete=all';
  } else if (deleteScope === 'future') {
    url += '?delete=future';
  }
  // For 'single' scope, no query parameter is needed
  
  
  try {
    const response = await apiClient.delete(url, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

  
export const createTimetable = async (timetableData: any, token: string | null | undefined) => {
  try {
    const response = await apiClient.post('/timetables/', 
      timetableData,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    return response.data;

  } catch (error) {
    throw error;
  }
};
export const getTimetables = async (token: string | null | undefined) => {
  try {
    const response = await apiClient.get("/api/user/timetables/", {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const getTimetable = async (timetableId: string | number, token: string | null | undefined) => {
  try {
    const response = await apiClient.get(`/timetables/${timetableId}/`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const updateTimetable = async (id: string | number, name: string, description: string, token: string | null | undefined) => {
  try {
    const response = await apiClient.patch(`/timetables/${id}/`, 
      { name, description },  // Only name and description are sent as per your PUT endpoint
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteTimetable = async (id: string | number, token: string | null | undefined) => {
  try {
    const response = await apiClient.delete(`/timetables/${id}/`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};


export const createPeriod = async (periodData: any, token: string | null | undefined) => {
  try {
    const response = await apiClient.post('/periods/', 
      periodData,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    return response.data;

  } catch (error) {
    throw error;
  }
};

export const getPeriod = async (periodId: string | number, token: string | null | undefined) => {
  try {
    const response = await apiClient.get(`/periods/${periodId}/`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const updatePeriod = async (periodId: string | number, periodData: any, token: string | null | undefined) => {
  try {
    const response = await apiClient.patch(`/periods/${periodId}/`, 
      periodData, // This should match the Period model structure
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deletePeriod = async (periodId: string | number, token: string | null | undefined) => {
  try {
    const response = await apiClient.delete(`/periods/${periodId}/`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUserDetails = async (userId: number, token: string | null | undefined) => {
  try {
    const response = await apiClient.get(`/api/users/${userId}/`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};