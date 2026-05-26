import { useQuery, UseQueryResult } from '@tanstack/react-query';
import * as homeService from '@/services/devotee/homeService';
import { Banner, CeremonyCategory, NearbyPriest, FestivalParsed } from '@/types/home.types';

/**
 * Custom React Query hook to fetch promotional banners.
 *
 * @returns Query result containing the list of active Banner objects.
 */
export function useBanners(): UseQueryResult<Banner[]> {
  return useQuery({
    queryKey: ['banners'],
    queryFn: () => homeService.fetchBanners(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Custom React Query hook to fetch active ceremony categories.
 *
 * @returns Query result containing the list of CeremonyCategory objects.
 */
export function useCategories(): UseQueryResult<CeremonyCategory[]> {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => homeService.fetchCategories(),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

/**
 * Custom React Query hook to fetch nearby priests based on geo-coordinates.
 * Enabled only when latitude and longitude coordinates are non-null.
 *
 * @param lat - User's current latitude, or null if undetermined.
 * @param lng - User's current longitude, or null if undetermined.
 * @returns Query result containing the list of NearbyPriest objects.
 */
export function useNearbyPriests(
  lat: number | null,
  lng: number | null
): UseQueryResult<NearbyPriest[]> {
  return useQuery({
    queryKey: ['nearbyPriests', lat, lng],
    queryFn: () => homeService.fetchNearbyPriests(lat!, lng!),
    enabled: lat !== null && lng !== null,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Custom React Query hook to fetch sorted list of upcoming festivals.
 *
 * @returns Query result containing the list of FestivalParsed objects.
 */
export function useUpcomingFestivals(): UseQueryResult<FestivalParsed[]> {
  return useQuery({
    queryKey: ['upcomingFestivals'],
    queryFn: () => homeService.fetchUpcomingFestivals(),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}
