export interface Puja {
  _id: string;
  name: string;
  description: string;
  image: string;
  requirements: {
    materials: {
      name: string;
      quantity: string;
      isOptional?: boolean;
    }[];
  };
  duration: {
    typical: number;
    minimum: number;
    maximum: number;
  };
  basePrice?: number;
  category?: string;
}
  _id: string;
  name: string;
  profilePicture?: string;
  languages: string[];
  rating: {
    average: number;
    count: number;
  };
  services?: {
    ceremonyId: string;
    price: number;
    durationMinutes: number;
  }[];
  location?: {
    coordinates: [number, number]; // [lng, lat]
  };
  serviceRadiusKm?: number;
  distance?: number; // Optional, calculated on frontend or returned by backend if geo query
}
