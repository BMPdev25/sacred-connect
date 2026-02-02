// pujaApi.ts — now calling REAL backend

import ceremonyService from "./ceremonyService";
import priestService from "./priestService";

// --------------------------------------------
// FETCH PUJA DETAILS FROM BACKEND
// --------------------------------------------
export async function fetchPujaById(id: string) {
  try {
    const data = await ceremonyService.getPujaById(id);
    return data;
  } catch (error) {
    console.error("Error fetching puja:", error);
    throw "Unable to load puja details. Please try again later.";
  }
}

// --------------------------------------------
// FETCH PUJARIS FOR A GIVEN PUJA
// WITH OPTIONAL LOCATION
// --------------------------------------------
export async function fetchPujarisForPuja(
  ceremonyId: string,
  lat?: number,
  lng?: number,
  radius: number = 10
) {
  try {
    const pujaris = await priestService.getAvailablePujaris({
      ceremonyId,
      lat,
      lng,
      radius,
    });

    return pujaris;
  } catch (error) {
    console.error("Error fetching pujaris:", error);
    throw "Unable to load pujaris. Please try again later.";
  }
}
