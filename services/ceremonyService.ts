import api from "../api";

/**
 * Ceremony / Puja Service — handles all ceremony-related API calls
 */
const ceremonyService = {
  /**
   * Fetch a single puja / ceremony by ID
   * @param id string
   * @returns Promise<any>
   */
  getPujaById: async (id: string): Promise<any> => {
    try {
      const response = await api.get(`/api/ceremonies/${id}`);
      return response.data;
    } catch (error: any) {
      console.error("Error fetching puja:", error);
      throw error?.response?.data?.message || "Failed to load puja details.";
    }
  },

  /**
   * Fetch all pujas (optional pagination)
   * @param params optional { page, limit }
   */
  getAllPujas: async (params?: { page?: number; limit?: number }): Promise<any> => {
    try {
      const response = await api.get("/api/ceremonies", { params });
      return response.data;
    } catch (error: any) {
      console.error("Error fetching pujas:", error);
      throw error?.response?.data?.message || "Failed to fetch pujas.";
    }
  },

  /**
   * Search pujas by name or keywords
   * @param query string
   */
  searchPujas: async (query: string): Promise<any> => {
    try {
      const response = await api.get(`/api/ceremonies/search`, {
        params: { query },
      });
      return response.data;
    } catch (error: any) {
      console.error("Error searching pujas:", error);
      throw error?.response?.data?.message || "Puja search failed.";
    }
  },

  /**
   * Get ceremony categories (e.g. Home Rituals, Marriage, Festivals)
   */
  getCategories: async (): Promise<any> => {
    try {
      const response = await api.get(`/api/ceremonies/categories`);
      return response.data;
    } catch (error: any) {
      console.error("Error fetching categories:", error);
      throw error?.response?.data?.message || "Failed to fetch categories.";
    }
  },

  /**
   * Get pujas under a given category
   * @param categoryId string
   */
  getPujasByCategory: async (categoryId: string): Promise<any> => {
    try {
      const response = await api.get(`/api/ceremonies/category/${categoryId}`);
      return response.data;
    } catch (error: any) {
      console.error("Error fetching pujas by category:", error);
      throw error?.response?.data?.message || "Failed to fetch pujas.";
    }
  }
};

export default ceremonyService;
