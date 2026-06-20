import { io, Socket } from 'socket.io-client';
import { BookingRequest } from '@/types/priest.dashboard.types';
import { logger } from '@/utils/logger';

let socket: Socket | null = null;

// Determine backend base URL from API endpoint config (e.g. stripping '/api' path suffix)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/api$/, '') || 'http://localhost:5000';

/**
 * Initializes and establishes the Socket.io connection for the authenticated priest.
 *
 * @param priestId - The unique user/profile ID of the priest.
 */
export function connectSocket(priestId: string): void {
  if (socket && (socket.connected || (socket as any).connecting)) {
    logger.log('Socket already connected or connecting, skipping initialization');
    return;
  }

  // If socket exists but is neither connected nor connecting:
  if (socket) {
    socket.disconnect(); // clean up the stale socket first
    socket = null;
  }

  socket = io(API_BASE_URL, {
    transports: ['websocket'],
    auth: { priestId },
  });

  socket.on('connect', () => {
    logger.log('Socket connected for priest:', priestId);
    // Explicitly send registration signal to enable matching of sockets to active sessions
    socket?.emit('register', priestId);
  });

  socket.on('disconnect', () => {
    logger.log('Socket disconnected');
  });

  socket.on('connect_error', (error) => {
    logger.warn('Socket connection failed:', error.message);
  });
}

/**
 * Registers a event listener callback triggered when a new booking request is broadcasted.
 *
 * @param callback - Function invoked with the new BookingRequest payload details.
 */
export function onNewBookingRequest(callback: (request: BookingRequest) => void): void {
  if (!socket) {
    logger.warn('Cannot register new booking request listener: socket not initialized');
    return;
  }
  socket.on('new_booking_request', callback);
}

/**
 * Removes the active event listener for new booking requests.
 *
 * @param callback - The specific callback to remove.
 */
export function offNewBookingRequest(callback?: (request: BookingRequest) => void): void {
  if (socket) {
    if (callback) {
      socket.off('new_booking_request', callback);
    } else {
      socket.off('new_booking_request');
    }
  }
}

/**
 * Registers a listener for instant booking requests broadcast by the server.
 * The backend emits 'new_instant_request' (distinct from 'new_booking_request')
 * for instant bookings that need a priest to claim them.
 *
 * @param callback - Same shape as onNewBookingRequest; reuse the same handler.
 */
export function onNewInstantRequest(callback: (request: BookingRequest) => void): void {
  if (!socket) {
    logger.warn('Cannot register instant request listener: socket not initialized');
    return;
  }
  socket.on('new_instant_request', callback);
}

/**
 * Removes the active event listener for instant booking requests.
 *
 * @param callback - The specific callback to remove.
 */
export function offNewInstantRequest(callback?: (request: BookingRequest) => void): void {
  if (socket) {
    if (callback) {
      socket.off('new_instant_request', callback);
    } else {
      socket.off('new_instant_request');
    }
  }
}

/**
 * Disconnects the socket client connection and releases the reference.
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    logger.log('Socket reference cleaned up');
  }
}

/**
 * Checks whether the socket is currently connected.
 *
 * @returns True if connected, false otherwise.
 */
export function isConnected(): boolean {
  return socket?.connected ?? false;
}

/**
 * Grouped export wrapper for socket management.
 */
export const SocketManager = {
  connectSocket,
  onNewBookingRequest,
  offNewBookingRequest,
  disconnectSocket,
  isConnected,
};
