import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import ceremonyService from "../services/ceremonyService";
import { useLocalSearchParams } from "expo-router";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export const useExplorePujas = () => {
  const { category: initialCategory } = useLocalSearchParams<{ category?: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [activeCategory, setActiveCategory] = useState(initialCategory || "all");

  useEffect(() => {
    if (initialCategory) {
      setActiveCategory(initialCategory);
    }
  }, [initialCategory]);

  const {
    data: categories = [],
    isLoading: isLoadingCats,
    isError: isErrorCats,
    refetch: refetchCats,
  } = useQuery({
    queryKey: ["ceremony-categories"],
    queryFn: ceremonyService.getCategories,
  });

  const {
    data: ceremoniesData,
    isLoading: isLoadingCeremonies,
    isError: isErrorCeremonies,
    refetch: refetchCeremonies,
  } = useQuery({
    queryKey: ["ceremonies", activeCategory, debouncedSearch],
    queryFn: () => {
      if (debouncedSearch.trim()) {
        return ceremonyService.searchPujas(debouncedSearch);
      }
      return activeCategory === "all"
        ? ceremonyService.getAllPujas()
        : ceremonyService.getPujasByCategory(activeCategory);
    },
  });

  const ceremonies = ceremoniesData?.ceremonies || ceremoniesData || [];
  const isLoading = isLoadingCats || isLoadingCeremonies;
  const isError = isErrorCats || isErrorCeremonies;

  const handleRetry = () => {
    if (isErrorCats) refetchCats();
    if (isErrorCeremonies) refetchCeremonies();
  };

  return {
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    categories,
    ceremonies,
    isLoading,
    isError,
    handleRetry,
  };
};
