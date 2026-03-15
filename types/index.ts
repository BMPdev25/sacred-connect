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
  pricing?: {
    basePrice: number;
    priceRange: {
      min: number;
      max: number;
    };
  };
  category?: string;
  ritualSteps?: {
    stepNumber: number;
    title: string;
    description: string;
    durationEstimate?: number;
    extraCharge?: number;
  }[];
}

export interface Priest {
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
    customSteps?: {
      title: string;
      description: string;
      durationEstimate?: number;
      extraCharge?: number;
    }[];
    ritualSteps?: {
      stepNumber: number;
      title: string;
      description: string;
      durationEstimate?: number;
      extraCharge?: number;
    }[];
  }[];
  location?: {
    coordinates: [number, number]; // [lng, lat]
  };
  serviceRadiusKm?: number;
  distance?: number; // Optional, calculated on frontend or returned by backend if geo query
  ceremonyCount?: number; // Number of pujas completed
  completionRate?: number; // Reliability score (0-100)
  cancelledCount?: number; // Number of cancelled bookings
  noShowCount?: number; // Number of no-show bookings
  religiousTradition?: string;
  experience?: number;
  ceremonies?: { id?: string; name: string; price: number; ritualSteps?: any[] }[];
}

export type Pujari = Priest;

export type BookingStatus = 'pending' | 'searching' | 'confirmed' | 'completed' | 'cancelled' | 'expired';
export type BookingType = 'scheduled' | 'instant';

export interface Booking {
  _id: string;
  devoteeId: string;
  priestId?: string;
  ceremonyType: string;
  date: string;
  startTime: string;
  endTime: string;
  location: {
    address: string;
    city: string;
    coordinates?: {
      type: 'Point';
      coordinates: [number, number];
    };
  };
  status: BookingStatus;
  bookingType: BookingType;
  expiryTime?: string;
  totalAmount: number;
  basePrice: number;
  platformFee: number;
  createdAt: string;
}
