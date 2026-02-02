import api from './index';

export const getAllCeremonies = async () => {
  try {
    const response = await api.get('/api/ceremonies');
    return response.data;
  } catch (error) {
    console.error('Error fetching ceremonies:', error);
    throw error;
  }
};
