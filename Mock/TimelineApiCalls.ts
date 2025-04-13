import axios from 'axios';
import ApiUrl from './config'; 

const apiClient = axios.create({
    baseURL: ApiUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});
export const getTodayPlans = async (token, date, selectedCategory) => {
  const currentDate = date.toISOString().split('T')[0];
  let apiUrl = `${ApiUrl}/api/learner/tasks/?due_date=${currentDate}`;
  if (selectedCategory !== null) {
    apiUrl += `&category=${selectedCategory}`;
  }
  const response = await axios.get(apiUrl, {
    headers: { Authorization: `Token ${token}` },
  });
  return response.data.sort((a, b) => {
    const dateA = new Date(`${a.due_date}T${a.due_time}`);
    const dateB = new Date(`${b.due_date}T${b.due_time}`);
    return dateA.getTime() - dateB.getTime();
  });
};


export const cancelPeriodForToday = async (periodId, token) => {
 
  try {
    const response = await apiClient.post(`/periods/${periodId}/cancel/`, {
      date: new Date().toISOString().split('T')[0]
    }, {
      headers: { Authorization: `Token ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error canceling period for today:", error);
    throw error;
  }
};


export const uncancelPeriodForToday = async (periodId, token) => {
  try {
    const response = await apiClient.post(`/periods/${periodId}/uncancel/`, {
      date: new Date().toISOString().split('T')[0]
    }, {
      headers: { Authorization: `Token ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error uncanceling period for today:", error);
    throw error;
  }
};

export const getCategoryNames = async (token) => {
    try {
        const response = await apiClient.get('/api/task/categories/', {
            headers: { Authorization: `Token ${token}` },
        });

        console.table(response.data)
        return response.data.reduce((acc, category) => {
            acc[category.id] = category.name;
            console.table(acc)
            return acc;
        })
    
  } catch (error)
  {
      console.error('Error task categories:', error);
    throw error;
  }
};
export const getCategories = async (token) => {
       try {

    const response = await apiClient.get('/api/task/categories/', {
      headers: {
        Authorization: `Token ${token}`,
      },
    })
 
    return response.data.map(category => ({
      label: category.name,
      value: category.id,
    }));
          } catch (error)
   {  console.error('Error fetching task categoriess:', error);
    throw error;
  }
};
  
export const createTask = async (taskData, token) => {
  try {
    const response = await apiClient.post('/tasks/', taskData, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

export const updateTask = async (taskId, taskData, token) => {
  console.log(taskId)
  console.log(taskData)
  try {
    const response = await apiClient.put(`/tasks/${taskId}/`, taskData, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

export const deleteTask = async (taskId, token) => {
  try {
    const response = await apiClient.delete(`/tasks/${taskId}/`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

  
export const createTimetable = async (timetableData, token) => {
  console.log(timetableData)
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
    console.error('Error creating timetable:', error);
    throw error;
  }
};
export const getTimetables = async (token: string) => {
  try {
    const response = await apiClient.get("/api/user/timetables/", {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching timetables:", error);
    throw error;
  }
};
export const getTimetable = async (timetableId: any, token: string) => {
  try {
    const response = await apiClient.get(`/timetables/${timetableId}/`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching period:', error);
    throw error;
  }
};
export const updateTimetable = async ( id, name, description , token) => {
  console.log(name)
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
    console.error('Error updating timetable:', error);
    throw error;
  }
};

export const deleteTimetable = async (id, token) => {
  try {
    const response = await apiClient.delete(`/timetables/${id}/`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting timetable:', error);
    throw error;
  }
};


export const createPeriod = async (periodData, token) => {
  console.log("YO",periodData)
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
    console.error('Error creating period:', error);
    throw error;
  }
};

export const getPeriod = async (periodId, token) => {
  try {
    const response = await apiClient.get(`/periods/${periodId}/`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching period:', error);
    throw error;
  }
};
export const updatePeriod = async (periodId, periodData, token) => {
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
    console.error('Error updating period:', error);
    throw error;
  }
};

export const deletePeriod = async (periodId, token) => {
  try {
    const response = await apiClient.delete(`/periods/${periodId}/`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting period:', error);
    throw error;
  }
};

export const getUserDetails = async (userId: number, token: string) => {
  try {
    const response = await apiClient.get(`/api/users/${userId}/`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
};