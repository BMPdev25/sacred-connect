import { useState, useEffect, useCallback } from "react";
import * as Location from "expo-location";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import devoteeService from "../services/devoteeService";
import ceremonyService from "../services/ceremonyService";
import { calculateDistance } from "../utils/locationUtils";
import { useQueryClient } from "@tanstack/react-query";

export const useHomeDashboard = () => {
  const { userInfo } = useSelector((state: RootState) => state.auth);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const [recommendedPriests, setRecommendedPriests] = useState<any[]>([]);
  const [pendingActions, setPendingActions] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [currentCity, setCurrentCity] = useState("Hyderabad");

  const [panchang, setPanchang] = useState<any>(null);
  const [ceremoniesData, setCeremoniesData] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const fetchData = async (coords?: { latitude: number; longitude: number }) => {
    try {
      setIsLoading(true);
      setIsError(false);

      const [
        priestsRes,
        actionsRes,
        addressRes,
        recentRes,
        bannersRes,
        panchangRes,
        categoriesRes,
        ceremoniesRes,
      ] = await Promise.allSettled([
        devoteeService.searchPriests({ limit: 10 }),
        devoteeService.getPendingActions(),
        devoteeService.getAddresses(),
        devoteeService.getBookings("completed"),
        devoteeService.getBanners(),
        devoteeService.getPanchang(),
        devoteeService.getCategories(),
        ceremonyService.getAllPujas({ limit: 5 }),
      ]);

      if (categoriesRes.status === "rejected" || ceremoniesRes.status === "rejected") {
        setIsError(true);
        return;
      }

      if (priestsRes.status === "fulfilled" && priestsRes.value?.priests?.length > 0) {
        let priests = priestsRes.value.priests;
        const effectiveCoords = coords || userCoords;
        if (effectiveCoords) {
          priests = priests.map((p: any) => {
            if (p.location?.coordinates) {
              const distance = calculateDistance(
                effectiveCoords.latitude,
                effectiveCoords.longitude,
                p.location.coordinates[1],
                p.location.coordinates[0]
              );
              return { ...p, distance };
            }
            return p;
          });
        }
        setRecommendedPriests(priests);
      }

      if (actionsRes.status === "fulfilled") setPendingActions(actionsRes.value);

      if (addressRes.status === "fulfilled" && Array.isArray(addressRes.value)) {
        const defaultAddr = addressRes.value.find((a) => a.isDefault) || addressRes.value[0];
        if (defaultAddr?.city) setCurrentCity(defaultAddr.city);
      }

      if (recentRes.status === "fulfilled") {
        const bookings = Array.isArray(recentRes.value)
          ? recentRes.value
          : recentRes.value?.data || [];
        const uniqueBookings: any[] = [];
        const seenCeremonies = new Set();
        for (const booking of bookings) {
          if (!seenCeremonies.has(booking.ceremonyType)) {
            seenCeremonies.add(booking.ceremonyType);
            uniqueBookings.push(booking);
          }
        }
        setRecentBookings(uniqueBookings.slice(0, 5));
      }

      if (bannersRes.status === "fulfilled" && bannersRes.value?.length > 0) setBanners(bannersRes.value);
      if (panchangRes.status === "fulfilled") setPanchang(panchangRes.value);
      if (categoriesRes.status === "fulfilled") setCategories(categoriesRes.value);
      if (ceremoniesRes.status === "fulfilled") setCeremoniesData(ceremoniesRes.value.ceremonies || []);
    } catch (err) {
      console.error("Home feed error:", err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRequests = async () => {
    try {
      const requests = await devoteeService.getMyRequests();
      setMyRequests(Array.isArray(requests) ? requests.slice(0, 5) : []);
    } catch (err) {
      console.error("Load requests error:", err);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchData(userCoords || undefined), loadRequests()]);
    setRefreshing(false);
  }, [userCoords]);

  useEffect(() => {
    const init = async () => {
      let coords: { latitude: number; longitude: number } | undefined;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({});
          coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          setUserCoords(coords);
        }
      } catch (err) {
        console.warn("Location error:", err);
      } finally {
        fetchData(coords);
        loadRequests();
      }
    };
    init();
  }, []);

  return {
    isLoading,
    isError,
    refreshing,
    recommendedPriests,
    pendingActions,
    myRequests,
    recentBookings,
    currentCity,
    panchang,
    ceremoniesData,
    banners,
    categories,
    onRefresh,
    loadRequests,
    setPendingActions,
    userInfo,
    userCoords,
    fetchData,
  };
};
