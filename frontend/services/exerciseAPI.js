const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

const getAuthToken = async () => {
  // Implementation depends on your auth storage method
  // Example: return await AsyncStorage.getItem('authToken');
};

export const ExerciseAPI = {
  // Get exercises for a trail step
  getExercises: async (trailStepId) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/exercises/trail-step/${trailStepId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching exercises:', error);
      throw error;
    }
  },

  // Submit exercise results
  submitResults: async (results) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/exercises/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(results)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error submitting results:', error);
      throw error;
    }
  },

  // Get user progress
  getProgress: async (categoryId = null) => {
    try {
      const token = await getAuthToken();
      const url = categoryId 
        ? `${API_BASE_URL}/exercises/progress/${categoryId}`
        : `${API_BASE_URL}/exercises/progress`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching progress:', error);
      throw error;
    }
  },

  // Get weak vocabulary for review
  getWeakVocabulary: async (limit = 20) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/exercises/weak-vocabulary?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching weak vocabulary:', error);
      throw error;
    }
  }
};