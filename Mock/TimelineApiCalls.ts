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
  try{
    const response = await apiClient.post('/api/learner/task/create/',
      taskData,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    return response.data;
    
   }
   catch (error)
   {  console.error('Error creating schedule:', error);
    throw error;
   }

};
  
export const updateTask = async (taskId, taskData, token) => {
  try{
    const response = await apiClient.put(`/api/learner/tasks/update/${taskId}/`,
      taskData,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    return response.data;
    
   }
   catch (error)
   {  console.error('Error updating schedule:', error);
    throw error;
   }

};
  export const deleteTask = async (taskId, token) => {
  try{
    const response = await apiClient.delete(`/api/tasks/${taskId}/`,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    return response.data;
    
   }
   catch (error)
   {  console.error('Error deleting schedule:', error);
    throw error;
   }

  };