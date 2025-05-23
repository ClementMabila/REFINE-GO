import { z } from "zod";

// User schema
export const UserSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone_number: z.string().optional(),
  profile_picture: z.string().url().optional().nullable(),
  preferred_fuel_type: z.string().optional(),
  date_joined: z.string().datetime(),
});

export type User = z.infer<typeof UserSchema>;

// Vehicle schema
export const VehicleSchema = z.object({
  id: z.string().uuid(),
  user: z.number(),
  name: z.string(),
  make: z.string(),
  model: z.string(),
  year: z.number().int().positive(),
  fuel_type: z.enum([
    "PETROL_95", 
    "PETROL_98", 
    "DIESEL", 
    "ELECTRIC", 
    "HYBRID", 
    "LPG"
  ]),
  tank_capacity: z.number().positive(),
  avg_consumption: z.number().positive(),
  license_plate: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Vehicle = z.infer<typeof VehicleSchema>;

// Fuel Company schema
export const FuelCompanySchema = z.object({
  id: z.number(),
  name: z.string(),
  logo: z.string().url().optional().nullable(),
  website: z.string().url().optional(),
  description: z.string().optional(),
});

export type FuelCompany = z.infer<typeof FuelCompanySchema>;

// Station Amenity schema
export const StationAmenitySchema = z.object({
  id: z.number(),
  station: z.string().uuid(),
  amenity_type: z.string(),
  amenity_type_display: z.string(),
  is_operational: z.boolean(),
  details: z.string().optional(),
});

export type StationAmenity = z.infer<typeof StationAmenitySchema>;

// PetrolStation list schema
export const PetrolStationListSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  company: z.number(),
  company_name: z.string(),
  company_logo: z.string().url().optional().nullable(),
  address: z.string(),
  city: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  is_24h: z.boolean(),
  is_active: z.boolean(),
  average_rating: z.number().nullable(),
  distance: z.number().optional(), // For nearby stations endpoint
});

export type PetrolStationList = z.infer<typeof PetrolStationListSchema>;

// Current price schema for station detail
export const CurrentPriceSchema = z.object({
  fuel_type_id: z.number(),
  fuel_type_name: z.string(),
  price: z.number(),
  reported_at: z.string().datetime(),
});

export type CurrentPrice = z.infer<typeof CurrentPriceSchema>;

// Current traffic schema for station detail
export const CurrentTrafficSchema = z.object({
  current_visitors: z.number(),
  queue_length: z.number(),
  estimated_wait_time: z.number(),
  timestamp: z.string().datetime(),
});

export type CurrentTraffic = z.infer<typeof CurrentTrafficSchema>;

// PetrolStation detail schema
export const PetrolStationDetailSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  company: FuelCompanySchema,
  address: z.string(),
  city: z.string(),
  state: z.string(),
  postal_code: z.string(),
  country: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  phone_number: z.string().optional(),
  website: z.string().url().optional(),
  opening_hours: z.record(z.string()),
  is_24h: z.boolean(),
  is_active: z.boolean(),
  amenities: z.array(StationAmenitySchema),
  current_prices: z.array(CurrentPriceSchema),
  average_rating: z.number().nullable(),
  reviews_count: z.number(),
  current_traffic: CurrentTrafficSchema.nullable(),
});

export type PetrolStationDetail = z.infer<typeof PetrolStationDetailSchema>;

// Fuel Type schema
export const FuelTypeSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional(),
});

export type FuelType = z.infer<typeof FuelTypeSchema>;

// Fuel Price schema
export const FuelPriceSchema = z.object({
  id: z.number(),
  station: z.string().uuid(),
  station_name: z.string(),
  fuel_type: z.number(),
  fuel_type_name: z.string(), 
  price: z.number(),
  reported_by: z.number().optional().nullable(),
  is_verified: z.boolean(),
  reported_at: z.string().datetime(),
});

export type FuelPrice = z.infer<typeof FuelPriceSchema>;

// Review Image schema
export const ReviewImageSchema = z.object({
  id: z.number(),
  image: z.string().url(),
  caption: z.string().optional(),
  created_at: z.string().datetime(),
});

export type ReviewImage = z.infer<typeof ReviewImageSchema>;

// Review schema
export const ReviewSchema = z.object({
  id: z.number(),
  user: z.number(),
  user_username: z.string(),
  station: z.string().uuid(),
  station_name: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string(),
  service_rating: z.number().min(1).max(5).optional().nullable(),
  cleanliness_rating: z.number().min(1).max(5).optional().nullable(),
  price_rating: z.number().min(1).max(5).optional().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  images: z.array(ReviewImageSchema),
});

export type Review = z.infer<typeof ReviewSchema>;

// Favorite schema
export const FavoriteSchema = z.object({
  id: z.number(),
  user: z.number(),
  station: z.string().uuid(),
  station_detail: PetrolStationListSchema,
  notes: z.string().optional(),
  created_at: z.string().datetime(),
});

export type Favorite = z.infer<typeof FavoriteSchema>;

// Price Alert schema
export const PriceAlertSchema = z.object({
  id: z.number(),
  user: z.number(),
  fuel_type: z.number(),
  fuel_type_name: z.string(),
  target_price: z.number(),
  location_radius: z.number(),
  location_lat: z.number(),
  location_lng: z.number(),
  is_active: z.boolean(),
  created_at: z.string().datetime(),
});

export type PriceAlert = z.infer<typeof PriceAlertSchema>;

// Fuel Transaction schema
export const FuelTransactionSchema = z.object({
  id: z.number(),
  user: z.number(),
  vehicle: z.string().uuid(),
  vehicle_name: z.string(),
  station: z.string().uuid().optional().nullable(),
  station_name: z.string().optional(),
  fuel_type: z.number(),
  fuel_type_name: z.string(),
  quantity: z.number().positive(),
  price_per_unit: z.number().positive(),
  total_amount: z.number().positive(),
  odometer_reading: z.number().int().positive().optional().nullable(),
  transaction_date: z.string().datetime(),
});

export type FuelTransaction = z.infer<typeof FuelTransactionSchema>;

// Refuel Stop schema
export const RefuelStopSchema = z.object({
  id: z.number(),
  trip_plan: z.number(),
  station: z.string().uuid(),
  station_detail: PetrolStationListSchema,
  distance_from_start: z.number(),
  estimated_fuel_level: z.number(),
  order: z.number().int().positive(),
});

export type RefuelStop = z.infer<typeof RefuelStopSchema>;

// Trip Plan schema
export const TripPlanSchema = z.object({
  id: z.number(),
  user: z.number(),
  vehicle: z.string().uuid(),
  vehicle_name: z.string(),
  start_address: z.string(),
  start_latitude: z.number(),
  start_longitude: z.number(),
  destination_address: z.string(),
  destination_latitude: z.number(),
  destination_longitude: z.number(),
  total_distance: z.number(),
  created_at: z.string().datetime(),
  refuel_stops: z.array(RefuelStopSchema).optional(),
});

export type TripPlan = z.infer<typeof TripPlanSchema>;

// Notification schema
export const NotificationSchema = z.object({
  id: z.number(),
  user: z.number(),
  notification_type: z.string(),
  notification_type_display: z.string(),
  title: z.string(),
  message: z.string(),
  related_object_id: z.string().optional(),
  related_object_type: z.string().optional(),
  is_read: z.boolean(),
  created_at: z.string().datetime(),
});

export type Notification = z.infer<typeof NotificationSchema>;

// Promotion Campaign schema
export const PromotionCampaignSchema = z.object({
  id: z.number(),
  company: z.number(),
  company_name: z.string(),
  title: z.string(),
  description: z.string(),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  is_active: z.boolean(),
  banner_image: z.string().url().optional().nullable(),
  terms_conditions: z.string().optional(),
  created_at: z.string().datetime(),
});

export type PromotionCampaign = z.infer<typeof PromotionCampaignSchema>;

// Dashboard Summary schema
export const DashboardSummarySchema = z.object({
  vehicles_count: z.number(),
  favorites_count: z.number(),
  recent_transactions: z.array(FuelTransactionSchema),
  active_alerts: z.number(),
  unread_notifications: z.number(),
  month_spending: z.number(),
});

export type DashboardSummary = z.infer<typeof DashboardSummarySchema>;