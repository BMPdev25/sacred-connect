// src/services/searchService.js
import api from '../api';

const searchService = {
  // Universal search for priests and ceremonies
  universalSearch: async (query, filters = {}) => {
    const response = await api.get('/search/universal', {
      params: { query, ...filters }
    });
    return response.data;
  },

  // Get search suggestions for autocomplete
  getSearchSuggestions: async (query, type = 'all') => {
    const response = await api.get('/search/suggestions', {
      params: { query, type }
    });
    return response.data;
  },

  // Get popular ceremonies
  getPopularCeremonies: async (limit = 20, category = '', religiousTradition = '') => {
    const response = await api.get('/search/ceremonies/popular', {
      params: { limit, category, religiousTradition }
    });
    return response.data;
  },

  // Get ceremony details
  getCeremonyDetails: async (ceremonyId) => {
    const response = await api.get(`/search/ceremonies/${ceremonyId}`);
    return response.data;
  },

  // Get ceremony categories
  getCeremonyCategories: async () => {
    const response = await api.get('/search/ceremonies/categories');
    return response.data;
  },
};

export default searchService;
