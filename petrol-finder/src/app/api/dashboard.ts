import axios from 'axios';
import { 
  UserSchema, 
  VehicleSchema, 
  PetrolStationListSchema, 
  PetrolStationDetailSchema, 
  FuelTypeSchema,
  FuelPriceSchema,
  ReviewSchema,
  FavoriteSchema,
  PriceAlertSchema,
  FuelTransactionSchema,
  TripPlanSchema,
  NotificationSchema,
  PromotionCampaignSchema,
  DashboardSummarySchema
} from './schemas';

// Create axios instance with base URL and default headers
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    if (!config.headers) {
      config.headers = {};
    }
    config.headers['Authorization'] = `Token ${token}`;
  }
  return config;
});

// Handle response parsing and validation
const validateResponse = (schema: any, data: any) => {
  try {
    return schema.parse(data);
  } catch (error) {
    console.error('Validation error:', error);
    throw new Error('Invalid data received from API');
  }
};

// API service functions
export const api = {
  // Auth
  login: async (username: string, password: string) => {
    const response = await apiClient.post('/auth/token/', { username, password });
    return response.data;
  },
  
  register: async (userData: any) => {
    const response = await apiClient.post('/auth/register/', userData);
    return response.data;
  },
  
  // User
  getCurrentUser: async () => {
    const response = await apiClient.get('/users/me/');
    return validateResponse(UserSchema, response.data);
  },
  
  // Vehicles
  getVehicles: async () => {
    const response = await apiClient.get('/vehicles/');
    return (response.data as any[]).map((item: any) => validateResponse(VehicleSchema, item));
  },
  
  getVehicle: async (id: string) => {
    const response = await apiClient.get(`/vehicles/${id}/`);
    return validateResponse(VehicleSchema, response.data);
  },
  
  createVehicle: async (vehicleData: any) => {
    const response = await apiClient.post('/vehicles/', vehicleData);
    return validateResponse(VehicleSchema, response.data);
  },
  
  updateVehicle: async (id: string, vehicleData: any) => {
    const response = await apiClient.patch(`/vehicles/${id}/`, vehicleData);
    return validateResponse(VehicleSchema, response.data);
  },
  
  deleteVehicle: async (id: string) => {
    await apiClient.delete(`/vehicles/${id}/`);
    return true;
  },
  
  // Petrol Stations
  getNearbyStations: async (lat: number, lng: number, radius: number = 5, fuelType?: string) => {
    const params = { lat, lng, radius, ...(fuelType && { fuel_type: fuelType }) };
    const response = await apiClient.get('/petrol-stations/nearby/', { params });
    return (response.data as any[]).map((item: any) => validateResponse(PetrolStationListSchema, item));
  },
  
  getStationDetails: async (id: string) => {
    const response = await apiClient.get(`/petrol-stations/${id}/`);
    return validateResponse(PetrolStationDetailSchema, response.data);
  },
  
  toggleFavoriteStation: async (id: string, notes?: string) => {
    const response = await apiClient.post(`/petrol-stations/${id}/toggle_favorite/`, { notes });
    return response.data;
  },
  
  // Fuel Types
  getAllFuelTypes: async () => {
    const response = await apiClient.get('/fuel-types/');
    return (response.data as any[]).map((item: any) => validateResponse(FuelTypeSchema, item));
  },
  
  // Fuel Prices
  getLatestPricesByStation: async (stationId: string) => {
    const response = await apiClient.get(`/fuel-prices/latest_by_station/`, {
      params: { station_id: stationId }
    });
    return (response.data as any[]).map((item: any) => validateResponse(FuelPriceSchema, item));
  },
  
  reportFuelPrice: async (priceData: any) => {
    const response = await apiClient.post('/fuel-prices/', priceData);
    return validateResponse(FuelPriceSchema, response.data);
  },
  
  // Reviews
  getStationReviews: async (stationId: string) => {
    const response = await apiClient.get('/reviews/', {
      params: { station: stationId }
    });
    return (response.data as any[]).map((item: any) => validateResponse(ReviewSchema, item));
  },
  
  addReview: async (reviewData: any) => {
    const response = await apiClient.post('/reviews/', reviewData);
    return validateResponse(ReviewSchema, response.data);
  },
  
  // Favorites
  getUserFavorites: async () => {
    const response = await apiClient.get('/favorites/');
    return (response.data as any[]).map((item: any) => validateResponse(FavoriteSchema, item));
  },
  
  // Price Alerts
  getUserPriceAlerts: async () => {
    const response = await apiClient.get('/price-alerts/');
    return (response.data as any[]).map((item: any) => validateResponse(PriceAlertSchema, item));
  },
  
  createPriceAlert: async (alertData: any) => {
    const response = await apiClient.post('/price-alerts/', alertData);
    return validateResponse(PriceAlertSchema, response.data);
  },
  
  updatePriceAlert: async (id: number, alertData: any) => {
    const response = await apiClient.patch(`/price-alerts/${id}/`, alertData);
    return validateResponse(PriceAlertSchema, response.data);
  },
  
  deletePriceAlert: async (id: number) => {
    await apiClient.delete(`/price-alerts/${id}/`);
    return true;
  },
  
  // Fuel Transactions
  getUserTransactions: async () => {
    const response = await apiClient.get('/fuel-transactions/');
    return (response.data as any[]).map((item: any) => validateResponse(FuelTransactionSchema, item));
  },
  
  getVehicleTransactions: async (vehicleId: string) => {
    const response = await apiClient.get('/fuel-transactions/', {
      params: { vehicle: vehicleId }
    });
    return (response.data as any[]).map((item: any) => validateResponse(FuelTransactionSchema, item));
  },
  
  getTransactionStats: async (vehicleId: string) => {
    const response = await apiClient.get(`/fuel-transactions/stats/`, {
      params: { vehicle_id: vehicleId }
    });
    return response.data;
  },
  
  addTransaction: async (transactionData: any) => {
    const response = await apiClient.post('/fuel-transactions/', transactionData);
    return validateResponse(FuelTransactionSchema, response.data);
  },
  
  // Trip Plans
  getUserTripPlans: async () => {
    const response = await apiClient.get('/trip-plans/');
    return (response.data as any[]).map((item: any) => validateResponse(TripPlanSchema, item));
  },
  
  createTripPlan: async (tripData: any) => {
    const response = await apiClient.post('/trip-plans/', tripData);
    return validateResponse(TripPlanSchema, response.data);
  },
  
  calculateTripStops: async (tripId: number) => {
    const response = await apiClient.post(`/trip-plans/${tripId}/calculate_stops/`);
    return response.data;
  },
  
  // Notifications
  getUserNotifications: async () => {
    const response = await apiClient.get('/notifications/');
    return (response.data as any[]).map((item: any) => validateResponse(NotificationSchema, item));
  },
  
  markNotificationRead: async (id: number) => {
    await apiClient.post(`/notifications/${id}/mark_read/`);
    return true;
  },
  
  markAllNotificationsRead: async () => {
    await apiClient.post('/notifications/mark_all_read/');
    return true;
  },
  
  // Promotions
  getActivePromotions: async () => {
    const response = await apiClient.get('/promotions/');
    return (response.data as any[]).map((item: any) => validateResponse(PromotionCampaignSchema, item));
  },
  
  // Dashboard
  getDashboardSummary: async () => {
    const response = await apiClient.get('/dashboard/summary/');
    return validateResponse(DashboardSummarySchema, response.data);
  },
};

export default api;