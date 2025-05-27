"use client";

import Link from 'next/link';
import React, { useState, useEffect, useMemo } from 'react';
import { useRef, useCallback } from 'react';
import { 
  MapPin, 
  Search, 
  Filter, 
  ChevronDown, 
  Star, 
  Clock, 
  CreditCard, 
  Coffee, 
  Droplet, 
  Zap, 
  Info, 
  X, 
  MenuIcon,
  Moon,
  Sun,
  User,
  Settings,
  Bell,
  Home,
  DollarSign,
  Fuel,
  TrendingUp,
  Route,
  Plus,
  Heart,
  RefreshCw,
  CloudRain, 
  Thermometer, 
  Wind, 
  Eye, 
  Car, 
  MapIcon,
  Bookmark,
  Share2,
  ShoppingBag,
  Fuel as FuelIcon,
  Phone
} from 'lucide-react';

declare global {
  interface Window {
    google: any;
  }
}

interface PetrolStation {
  id: string;
  name: string;
  address: string;
  distance: number;
  rating: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  regularPrice: number;
  premiumPrice: number;
  dieselPrice: number;
  isOpen: boolean;
  hasATM: boolean;
  hasShop: boolean;
  hasCoffee: boolean;
  hasEVCharging: boolean;
  busyLevel: string;
  waitTime: number;
  source: string;
  has_price_data: boolean;
  reliability_score: number;
  photos?: string[];
}

interface UserLocation {
  lat: number;
  lng: number;
}

interface GoogleMap {
  setCenter: (location: { lat: number; lng: number }) => void;
  setZoom: (zoom: number) => void;
  getZoom: () => number;
  panTo: (location: { lat: number; lng: number }) => void;
  getBounds: () => any;
  setMapTypeId: (mapTypeId: string) => void;
}

interface GoogleMapsMarker {
  setMap: (map: GoogleMap | null) => void;
  addListener: (event: string, callback: () => void) => void;
  getPosition: () => any;
  setIcon: (icon: any) => void;
}

// 2. ADD THESE NEW INTERFACES (add after existing interfaces)
interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  visibility: number;
  icon: string;
}

interface RouteData {
  distance: string;
  duration: string;
  steps: RouteStep[];
  polyline: string;
}

interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
  maneuver: string;
}

interface UserLocationMarker {
  lat: number;
  lng: number;
  address: string;
  weather?: WeatherData;
}

type FuelType = 'regular' | 'premium' | 'diesel';

const PetrolFinderPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStation, setSelectedStation] = useState<PetrolStation | null>(null);
  const [fuelType, setFuelType] = useState<FuelType>('regular');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    atm: false,
    shop: false,
    coffee: false,
    evCharging: false,
    openNow: true
  });
  const [darkMode, setDarkMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [show, setShow] = useState(false);

  // API related state
  const [petrolStations, setPetrolStations] = useState<PetrolStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  // Maps related state
  const [map, setMap] = useState<GoogleMap | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<GoogleMapsMarker[]>([]);

  // User location marker
  const [userLocationData, setUserLocationData] = useState<UserLocationMarker | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [showWeatherTooltip, setShowWeatherTooltip] = useState(false);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [directionsService, setDirectionsService] = useState<any>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<any>(null);
  const [userLocationMarker, setUserLocationMarker] = useState<any>(null);
  const [watchPositionId, setWatchPositionId] = useState<number | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([]);
  const [showNearbyPlaces, setShowNearbyPlaces] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showRouteOptions, setShowRouteOptions] = useState(false);
  const [trafficLayer, setTrafficLayer] = useState<any>(null);
  const [showTraffic, setShowTraffic] = useState(false);

  // Memoized filtered stations to prevent unnecessary re-renders
  const filteredStations = useMemo(() => {
    return petrolStations.filter(station => {
      // Search filter
      if (searchQuery && !station.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !station.address.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Amenities filters
      if (filters.atm && !station.hasATM) return false;
      if (filters.shop && !station.hasShop) return false;
      if (filters.coffee && !station.hasCoffee) return false;
      if (filters.evCharging && !station.hasEVCharging) return false;
      if (filters.openNow && !station.isOpen) return false;
      
      return true;
    });
  }, [petrolStations, searchQuery, filters]);

  useEffect(() => {
  // Inject styles for InfoWindow
  const styleElement = document.createElement('style');
  styleElement.innerHTML = `
    .gm-ui-hover-effect {
      transition: all 0.2s ease-in-out !important;
    }
    
    .gm-style .gm-style-iw-c {
      padding: 0 !important;
      border-radius: 12px !important;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
      border: none !important;
      overflow: hidden !important;
    }
    
    .gm-style .gm-style-iw-d {
      overflow: hidden !important;
    }
    
    .gm-style .gm-style-iw-t::after {
      display: none !important;
    }
    
    .gm-style-iw-chr {
      display: none !important;
    }
    
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `;
  document.head.appendChild(styleElement);
  
  return () => {
    document.head.removeChild(styleElement);
  };
}, []);

  // Get user's current location
  const getUserLocation = useCallback((): Promise<UserLocation> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          let message = 'Unable to retrieve your location.';
          switch(error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location access denied by user.';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              message = 'Location request timed out.';
              break;
          }
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }, []);

  // Wheather fecth function
  const fetchWeatherData = useCallback(async (lat: number, lng: number): Promise<WeatherData | null> => {
  try {
    // Using OpenWeatherMap API (you'll need to get a free API key)
    const API_KEY = 'YOUR_OPENWEATHER_API_KEY'; // Replace with your API key
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=metric`
    );
    
    if (!response.ok) {
      // Fallback to mock data if API fails
      return {
        temperature: 22,
        condition: 'Clear',
        humidity: 65,
        windSpeed: 12,
        visibility: 10,
        icon: '01d'
      };
    }
    
    const data = await response.json();
    return {
      temperature: Math.round(data.main.temp),
      condition: data.weather[0].main,
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind?.speed * 3.6) || 0, // Convert m/s to km/h
      visibility: Math.round((data.visibility || 10000) / 1000), // Convert m to km
      icon: data.weather[0].icon
    };
  } catch (error) {
    console.error('Weather fetch failed:', error);
    // Return mock data
    return {
      temperature: 22,
      condition: 'Clear',
      humidity: 65,
      windSpeed: 12,
      visibility: 10,
      icon: '01d'
    };
  }
}, []);

  // Fetch petrol stations from API
  const fetchPetrolStations = useCallback(async (location: UserLocation, radius: number = 5) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `http://127.0.0.1:8000/api/api/petrol-stations/nearby_with_real_data/?lat=${location.lat}&lng=${location.lng}&radius=${radius}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Ensure data is an array
      const stationsArray = Array.isArray(data) ? data : data.results || [];
      
      setPetrolStations(stationsArray);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error fetching petrol stations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch petrol stations');
    } finally {
      setLoading(false);
    }
  }, []);

  
// Get address from coordinates
const getAddressFromCoords = useCallback(async (lat: number, lng: number): Promise<string> => {
  try {
    if (!window.google?.maps?.Geocoder) return 'Unknown location';
    
    const geocoder = new window.google.maps.Geocoder();
    return new Promise((resolve, reject) => {
      geocoder.geocode(
        { location: { lat, lng } },
        (results: any[], status: string) => {
          if (status === 'OK' && results[0]) {
            resolve(results[0].formatted_address);
          } else {
            resolve('Unknown location');
          }
        }
      );
    });
  } catch (error) {
    return 'Unknown location';
  }
}, []);

// Initialize directions service and renderer
const initializeDirections = useCallback(() => {
  if (!window.google?.maps || directionsService) return;
  
  const service = new window.google.maps.DirectionsService();
  const renderer = new window.google.maps.DirectionsRenderer({
    suppressMarkers: false,
    polylineOptions: {
      strokeColor: '#00d47e',
      strokeWeight: 3,
      strokeOpacity: 1
    },
    markerOptions: {
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#3B82F6',
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: '#FFFFFF'
      }
    }
  });
  
  setDirectionsService(service);
  setDirectionsRenderer(renderer);
}, [directionsService]);

// Replace the createUserLocationMarker function with this improved version
const createUserLocationMarker = useCallback(() => {
  if (!map || !userLocationData || !window.google) return;
  
  // Only create marker if it doesn't exist
  if (!userLocationMarker) {
    // Create pulsing marker SVG
    const personMarker = {
        url: 'data:image/svg+xml;base64,' + btoa(`
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
            <defs>
              <filter id="shadow">
                <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.3"/>
              </filter>
            </defs>
            <!-- Background circle -->
            <circle cx="18" cy="18" r="16" fill="#2edda2" stroke="#ffffff" stroke-width="3" filter="url(#shadow)"/>
            <!-- Head -->
            <circle cx="18" cy="14" r="6" fill="#ffffff"/>
            <!-- Eyes -->
            <circle cx="16" cy="12" r="1" fill="#333"/>
            <circle cx="20" cy="12" r="1" fill="#333"/>
            <!-- Smile -->
            <path d="M15 16 Q18 18 21 16" stroke="#333" stroke-width="1.5" fill="none" stroke-linecap="round"/>
            <!-- Body -->
            <ellipse cx="18" cy="24" rx="4" ry="6" fill="#ffffff"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(36, 36),
        anchor: new window.google.maps.Point(18, 18)
      };
    
    const marker = new window.google.maps.Marker({
      position: { lat: userLocationData.lat, lng: userLocationData.lng },
      map: map,
      icon: personMarker,
      title: 'Your Location',
      zIndex: 1000
    });
    
    // Create info window with weather and location info
    const infoContent = `
      <div class="bg-white rounded-lg p-4 min-w-[280px] max-h-[320px] overflow-y-auto shadow-lg scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-semibold text-gray-800">Your Location</h3>
          ${weatherData ? `<div class="flex items-center text-blue-600">
            <span class="text-2xl mr-1">${weatherData.temperature}°C</span>
          </div>` : ''}
        </div>

        <p class="text-sm text-gray-600 mb-3">${userLocationData.address}</p>

        ${weatherData ? `
          <div class="grid grid-cols-2 gap-3 mb-3">
            <div class="flex items-center">
              <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                <svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z"/>
                </svg>
              </div>
              <div>
                <div class="text-xs text-gray-500">Condition</div>
                <div class="text-sm font-medium">${weatherData.condition}</div>
              </div>
            </div>

            <div class="flex items-center">
              <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-2">
                <svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                </svg>
              </div>
              <div>
                <div class="text-xs text-gray-500">Humidity</div>
                <div class="text-sm font-medium">${weatherData.humidity}%</div>
              </div>
            </div>
          </div>
        ` : ''}

        <div class="flex gap-2 mt-3">
          <button onclick="window.toggleNearbyPlaces()" class="flex-1 bg-blue-500 text-white text-sm py-2 px-3 rounded-lg hover:bg-blue-600 transition-colors">
            Nearby Places
          </button>
          <button onclick="window.shareLocation()" class="flex-1 bg-gray-500 text-white text-sm py-2 px-3 rounded-lg hover:bg-gray-600 transition-colors">
            Share Location
          </button>
        </div>
      </div>
    `;

    
    const infoWindow = new window.google.maps.InfoWindow({
      content: infoContent,
      maxWidth: 320
    });
    
    let isInfoWindowOpen = false;

    marker.addListener('click', () => {
      if (isInfoWindowOpen) {
        infoWindow.close();
        isInfoWindowOpen = false;
      } else {
        infoWindow.open(map, marker);
        isInfoWindowOpen = true;
      }
    });

    
    setUserLocationMarker(marker);
  } else {
    // Update existing marker position only
    userLocationMarker.setPosition({ 
      lat: userLocationData.lat, 
      lng: userLocationData.lng 
    });
  }
}, [map, userLocationData, weatherData, userLocationMarker]);

  // Fetch notifications from API

  const fetchNotifications = useCallback(async () => {
    try {
      setLoadingNotifications(true);
      setNotificationsError(null);

      const response = await fetch('http://127.0.0.1:8000/api/notifications/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const filtered = data.filter((n: any) => n.notification_type === 'PRICE_ALERT');
      setNotifications(filtered);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setNotificationsError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  // Refresh data
  const handleRefresh = useCallback(async () => {
    if (userLocation) {
      await fetchPetrolStations(userLocation);
    }
  }, [userLocation, fetchPetrolStations]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  // Helper functions
  const getBusyLevelColor = (level: string): string => {
    const colorMap: { [key: string]: string } = {
      low: "bg-green-500",
      medium: "bg-yellow-500",
      high: "bg-red-500",
    };
    return colorMap[level] || "bg-gray-500";
  };

  const getBusyLevelText = (level: string): string => {
    const textMap: { [key: string]: string } = {
      low: "Not Busy",
      medium: "Moderately Busy",
      high: "Very Busy",
    };
    return textMap[level] || "Unknown";
  };

  // Price display based on selected fuel type
  const getPrice = useCallback((station: PetrolStation): number => {
    switch (fuelType) {
      case 'regular': return station.regularPrice;
      case 'premium': return station.premiumPrice;
      case 'diesel': return station.dieselPrice;
      default: return station.regularPrice;
    }
  }, [fuelType]);

  // Format reliability score
  const formatReliabilityScore = (score: number): string => {
    return `${Math.round(score * 100)}% reliable`;
  };

  // MAPS RELATED - START
  const loadGoogleMapsScript = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      if (window.google && window.google.maps) {
        setGoogleMapsLoaded(true);
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBaAEWhPar9iLI0xkMjL3uIvJ81Z9y8FAA&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setGoogleMapsLoaded(true);
        resolve();
      };
      script.onerror = () => reject(new Error('Failed to load Google Maps'));
      document.head.appendChild(script);
    });
  }, []);


// Initialize Google Maps
const initializeMap = useCallback(() => {
  if (!mapRef.current || !googleMapsLoaded || !userLocation || isMapLoaded) return;

  const mapOptions = {
    center: { lat: userLocation.lat, lng: userLocation.lng },
    zoom: 13,
    styles: darkMode ? [
      {
        "elementType": "geometry",
        "stylers": [{ "color": "#242f3e" }]  // Better dark background
      },
      {
        "elementType": "labels.text.stroke",
        "stylers": [{ "color": "#242f3e" }]
      },
      {
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#746855" }]
      },
      {
        "featureType": "administrative.locality",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#d59563" }]
      },
      {
        "featureType": "poi",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#d59563" }]
      },
      {
        "featureType": "poi.park",
        "elementType": "geometry",
        "stylers": [{ "color": "#263c3f" }]
      },
      {
        "featureType": "poi.park",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#6b9a76" }]
      },
      {
        "featureType": "road",
        "elementType": "geometry",
        "stylers": [{ "color": "#38414e" }]
      },
      {
        "featureType": "road",
        "elementType": "geometry.stroke",
        "stylers": [{ "color": "#212a37" }]
      },
      {
        "featureType": "road",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#9ca5b3" }]
      },
      {
        "featureType": "road.highway",
        "elementType": "geometry",
        "stylers": [{ "color": "#746855" }]
      },
      {
        "featureType": "road.highway",
        "elementType": "geometry.stroke",
        "stylers": [{ "color": "#1f2835" }]
      },
      {
        "featureType": "road.highway",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#f3d19c" }]
      },
      {
        "featureType": "transit",
        "elementType": "geometry",
        "stylers": [{ "color": "#2f3948" }]
      },
      {
        "featureType": "transit.station",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#d59563" }]
      },
      {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [{ "color": "#17263c" }]
      },
      {
        "featureType": "water",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#515c6d" }]
      },
      {
        "featureType": "water",
        "elementType": "labels.text.stroke",
        "stylers": [{ "color": "#17263c" }]
      }
    ] : [],
    disableDefaultUI: false,
    zoomControl: false,
    mapTypeControl: false, // Enable map type control
    scaleControl: false,
    streetViewControl: true,
    rotateControl: false,
    fullscreenControl: false,

    keyboardShortcuts: false, 
    gestureHandling: 'auto',
  mapTypeControlOptions: {
    mapTypeIds: [] // Removes map type options completely
  }
  };

  const newMap = new window.google.maps.Map(mapRef.current, mapOptions);
  setMap(newMap);
  setIsMapLoaded(true);
  
  // Initialize directions after map is ready
  setTimeout(() => {
    initializeDirections();
  }, 1000);
}, [googleMapsLoaded, userLocation, darkMode, isMapLoaded, initializeDirections]);


// 4. ADD CUSTOM MAP CONTROLS - Add these functions to handle map type changes
interface ChangeMapTypeFn {
  (mapTypeId: string): void;
}

const changeMapType: ChangeMapTypeFn = useCallback((mapTypeId: string) => {
  if (map) {
    map.setMapTypeId(mapTypeId);
  }
}, [map]);

const zoomIn = useCallback(() => {
  if (map) {
    map.setZoom(map.getZoom() + 1);
  }
}, [map]);

const zoomOut = useCallback(() => {
  if (map) {
    map.setZoom(map.getZoom() - 1);
  }
}, [map]);

// Initialize user location data with weather and address
useEffect(() => {
  const initUserLocationData = async () => {
    if (!userLocation) return;
    
    const [address, weather] = await Promise.all([
      getAddressFromCoords(userLocation.lat, userLocation.lng),
      fetchWeatherData(userLocation.lat, userLocation.lng)
    ]);
    
    setUserLocationData({
      lat: userLocation.lat,
      lng: userLocation.lng,
      address,
      weather: weather ?? undefined
    });
    
    setWeatherData(weather);
  };
  
  initUserLocationData();
}, [userLocation, getAddressFromCoords, fetchWeatherData]);

// User Location marker effect
useEffect(() => {
  if (userLocationData && map && googleMapsLoaded) {
    createUserLocationMarker();
  }
}, [userLocationData, map, googleMapsLoaded, createUserLocationMarker]);

// Replace the updateUserLocationMarker function (add this new function)
const updateUserLocationMarker = useCallback((newLocation: UserLocation) => {
  if (userLocationMarker && newLocation) {
    // Smoothly animate to new position
    userLocationMarker.setPosition({
      lat: newLocation.lat,
      lng: newLocation.lng
    });
  }
}, [userLocationMarker]);

// Add a separate effect to handle location updates without recreating marker
useEffect(() => {
  if (userLocation && userLocationMarker) {
    updateUserLocationMarker(userLocation);
  }
}, [userLocation, updateUserLocationMarker]);

  // Create custom marker icon
  
const createCustomMarker = useCallback((station: PetrolStation, isSelected: boolean = false) => {
  if (!window.google) return null;
  
  const busyColor = station.busyLevel === 'low' ? '#10B981' : 
                  station.busyLevel === 'medium' ? '#2edda2' : '#EF4444';
  
  // Modern gas pump icon with rounded container
  const svgMarker =  {
        path: `M6 2h12c1.1 0 2 0.9 2 2v14c0 1.1-0.9 2-2 2h-2v6h-2v-6h-4v6H8v-6H6c-1.1 0-2-0.9-2-2V4c0-1.1 0.9-2 2-2z
              M8 6h8c0.55 0 1 0.45 1 1v8c0 0.55-0.45 1-1 1H8c-0.55 0-1-0.45-1-1V7c0-0.55 0.45-1 1-1z
              M10 8v6
              M14 8v6
              M18 11h4c0.55 0 1 0.45 1 1s-0.45 1-1 1h-4
              M12 28l-4-4h8l-4 4z`,
        fillColor: isSelected ? '#2edda2' : busyColor,
        fillOpacity: 1,
        strokeWeight: isSelected ? 3 : 2,
        strokeColor: '#FFFFFF',
        scale: isSelected ? 2.0 : 1.6,
        anchor: new window.google.maps.Point(12, 28)
      };

        return svgMarker;
      }, []);


  // Clear existing markers
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
  }, []);

  // Add markers to map
  const addMarkersToMap = useCallback(() => {
    if (!map || !googleMapsLoaded || !window.google) return;

    clearMarkers();
    const newMarkers: GoogleMapsMarker[] = [];

    filteredStations.forEach((station) => {
      const marker = new window.google.maps.Marker({
        position: { lat: station.coordinates.lat, lng: station.coordinates.lng },
        map: map,
        title: station.name,
        icon: createCustomMarker(station, selectedStation?.id === station.id),
        animation: window.google.maps.Animation.DROP
      });

      // Create info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div class="card bg-white shadow-xl border-0 min-w-[280px] max-w-[320px]">
            <div class="card-body p-4 overflow-y-scroll scrollbar-hide max-h-60 px-4 py-2">
              <!-- Header -->
              <div class="flex justify-between items-start mb-1">
                <div class="flex-1">
                  <h4 class="card-title text-sm font-semibold text-gray-800 mb-2">${station.name}</h4>
                  <p class="text-xs text-gray-600 line-clamp-2">${station.address}</p>
                </div>
                <div class="text-right ml-3 flex-shrink-0">
                  <div class="badge bg-[#00d47e] border-none text-sm badge-lg font-lighter">R${getPrice(station)}</div>
                  <div class="flex items-center justify-end mt-1">
                    <div class="rating rating-sm">
                      <div class="mask mask-star-2 bg-yellow-400 w-4 h-4"></div>
                    </div>
                    <span class="ml-1 text-sm text-white font-medium">${station.rating}</span>
                  </div>
                </div>
              </div>
              
              <!-- Status Pills -->
              <div class="flex items-center gap-1 mb-3">
                <div class="text-white badge ${station.isOpen ? 'badge-success' : 'badge-error'} badge-sm">
                  ${station.isOpen ? 'Open' : 'Closed'}
                </div>
                <div class="badge text-[#00d47e] bg-white border-[#00d47e] badge-ghost badge-sm">${station.distance} km away</div>
                <div class="badge badge-outline badge-sm ${
                  station.busyLevel === 'low' ? 'badge-success' : 
                  station.busyLevel === 'medium' ? 'badge-warning' : 'badge-error'
                }">
                  ${getBusyLevelText(station.busyLevel)}
                </div>
              </div>
              
              <!-- Fuel Prices Grid -->
              <div class="grid grid-cols-3 gap-2 mb-3">
                <div class="bg-[#00d47e] p-2 rounded-lg text-center">
                  <div class="text-xs text-white font-small">Regular</div>
                  <div class="font-bold text-xs text-white">R${station.regularPrice}</div>
                </div>
                <div class="bg-[#00d47e] p-2 rounded-lg text-center">
                  <div class="text-xs text-white font-small">Premium</div>
                  <div class="font-bold text-xs text-white">R${station.premiumPrice}</div>
                </div>
                <div class="bg-[#00d47e] p-2 rounded-lg text-center">
                  <div class="text-xs text-white font-small">Diesel</div>
                  <div class="font-bold text-xs text-white">R${station.dieselPrice}</div>
                </div>
              </div>
              
              <!-- Amenities -->
              <div class="flex flex-wrap gap-1 mb-4">
                ${station.hasATM ? '<div class="badge badge-info text-white badge-xs">ATM</div>' : ''}
                ${station.hasShop ? '<div class="badge badge-success text-white badge-xs">Shop</div>' : ''}
                ${station.hasCoffee ? '<div class="badge badge-warning text-white badge-xs">Coffee</div>' : ''}
                ${station.hasEVCharging ? '<div class="badge badge-secondary text-white badge-xs">EV Charging</div>' : ''}
              </div>
              
              <!-- Action Buttons -->
              <div class="card-actions justify-end mb-10">
                <button 
                  onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${station.coordinates.lat},${station.coordinates.lng}', '_blank')"
                  class="btn btn-primary bg-[#00d47e] btn-sm w-full transition-all border-none duration-200 hover:scale-105"
                >
                  <img src="https://img.icons8.com/?size=100&id=2924&format=png&color=FFFFFF" alt="Directions Icon" class="inline mr-1" style="height:20px; width:20px" />
                  Get Directions
                </button>
              </div>
              
              <!-- Reliability Score -->
              <div class="text-center mt-2">
                <div class="text-xs text-base-content/50">
                  ${formatReliabilityScore(station.reliability_score)} data reliability
                </div>
              </div>
            </div>
          </div>
        `,
        pixelOffset: new window.google.maps.Size(0, -10),
        disableAutoPan: false,
        maxWidth: 350
      });

      marker.addListener('mouseover', () => {
          marker.setIcon(createCustomMarker(station, true));
        });

        marker.addListener('mouseout', () => {
          if (selectedStation?.id !== station.id) {
            marker.setIcon(createCustomMarker(station, false));
          }
      });

      marker.addListener('click', () => {
  // If this marker's infoWindow is already open, close it and return
  if (marker.infoWindow.getMap()) {
    marker.infoWindow.close();
    setSelectedStation(null); // optional: clear state if needed
    return;
  }

  // Close all other info windows
  newMarkers.forEach((m: any) => {
    if (m.infoWindow && m.infoWindow !== marker.infoWindow) {
      m.infoWindow.close();
    }
  });

  // Open this one
  marker.infoWindow.open(map, marker);
  setSelectedStation(station);

  // Smooth pan to marker
  map.panTo(marker.getPosition());
});


      // Store info window reference
      (marker as any).infoWindow = infoWindow;
      newMarkers.push(marker);
    });

    markersRef.current = newMarkers;
  }, [map, googleMapsLoaded, filteredStations, selectedStation, createCustomMarker, getPrice, clearMarkers]);

  // Update marker when station is selected from sidebar
  const updateSelectedMarker = useCallback(() => {
    if (!map || !selectedStation || !googleMapsLoaded) return;

    // Update all markers
    markersRef.current.forEach((marker: any, index) => {
      const station = filteredStations[index];
      if (station) {
        marker.setIcon(createCustomMarker(station, station.id === selectedStation.id));
      }
    });

    // Pan to selected station
    map.panTo({ 
      lat: selectedStation.coordinates.lat, 
      lng: selectedStation.coordinates.lng 
    });
  }, [map, selectedStation, filteredStations, createCustomMarker, googleMapsLoaded]);

  // Initialize location and fetch data
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Try to get user location
        const location = await getUserLocation();
        setUserLocation(location);
        setLocationError(null);
        
        // Fetch petrol stations with user location
        await fetchPetrolStations(location);

        if (show) {
          await fetchNotifications();
        }
      } catch (err) {
        console.error('Location error:', err);
        setLocationError(err instanceof Error ? err.message : 'Location access failed');
        
        // Fallback to default location (Pretoria, South Africa)
        const defaultLocation = { lat: -25.754, lng: 28.231 };
        setUserLocation(defaultLocation);
        await fetchPetrolStations(defaultLocation);
      }
    };

    initializeData();
  }, [show, getUserLocation, fetchPetrolStations, fetchNotifications]);

  // Load Google Maps when component mounts
  useEffect(() => {
    loadGoogleMapsScript()
      .then(() => {
        console.log('Google Maps loaded successfully');
      })
      .catch((error) => {
        console.error('Failed to load Google Maps:', error);
        setError('Failed to load Google Maps');
      });
  }, [loadGoogleMapsScript]);

  // Initialize map when script is loaded and user location is available
  useEffect(() => {
    initializeMap();
  }, [initializeMap]);

  // Update markers when stations change
  useEffect(() => {
    if (isMapLoaded && map && googleMapsLoaded) {
      addMarkersToMap();
    }
  }, [isMapLoaded, map, googleMapsLoaded, filteredStations, addMarkersToMap]);

  // Update selected marker when selection changes
  useEffect(() => {
    updateSelectedMarker();
  }, [updateSelectedMarker]);


// Calculate and display route
const calculateRoute = useCallback(async (destination: PetrolStation) => {
  if (!directionsService || !directionsRenderer || !userLocation || !map) return;
  
  setIsNavigating(true);
  
  try {
    const request = {
      origin: { lat: userLocation.lat, lng: userLocation.lng },
      destination: { lat: destination.coordinates.lat, lng: destination.coordinates.lng },
      travelMode: window.google.maps.TravelMode.DRIVING,
      avoidHighways: false,
      avoidTolls: false,
      provideRouteAlternatives: true
    };
    
    directionsService.route(request, (result: any, status: string) => {
      if (status === 'OK') {
        directionsRenderer.setMap(map);
        directionsRenderer.setDirections(result);
        
        const route = result.routes[0];
        const leg = route.legs[0];
        
        setRouteData({
          distance: leg.distance.text,
          duration: leg.duration.text,
          steps: leg.steps.map((step: any) => ({
            instruction: step.instructions.replace(/<[^>]*>/g, ''),
            distance: step.distance.text,
            duration: step.duration.text,
            maneuver: step.maneuver || 'straight'
          })),
          polyline: route.overview_polyline
        });
        
        setShowRouteOptions(true);
        
        // Start watching position for live updates
        startPositionTracking();
      } else {
        console.error('Route calculation failed:', status);
        alert('Could not calculate route. Please try again.');
      }
    });
  } catch (error) {
    console.error('Route error:', error);
    setIsNavigating(false);
  }
}, [directionsService, directionsRenderer, userLocation, map]);

// Replace the startPositionTracking function with this improved version
const startPositionTracking = useCallback(() => {
  if (!navigator.geolocation) return;
  
  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const newLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      
      // Update location state (this will trigger marker position update)
      setUserLocation(newLocation);
      
      // Don't recreate marker, just update position
      if (userLocationMarker) {
        userLocationMarker.setPosition(newLocation);
      }
    },
    (error) => {
      console.error('Position tracking error:', error);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000, // Increased timeout
      maximumAge: 5000 // Allow slightly older positions to prevent frequent updates
    }
  );
  
  setWatchPositionId(watchId);
}, [userLocationMarker]);

// Add this new function to handle marker cleanup properly
const cleanupUserLocationMarker = useCallback(() => {
  if (userLocationMarker) {
    userLocationMarker.setMap(null);
    setUserLocationMarker(null);
  }
}, [userLocationMarker]);

// Stop navigation
const stopNavigation = useCallback(() => {
  if (directionsRenderer) {
    directionsRenderer.setMap(null);
  }
  
  if (watchPositionId) {
    navigator.geolocation.clearWatch(watchPositionId);
    setWatchPositionId(null);
  }
  
  setIsNavigating(false);
  setRouteData(null);
  setShowRouteOptions(false);
}, [directionsRenderer, watchPositionId]);

// Toggle traffic layer
const toggleTrafficLayer = useCallback(() => {
  if (!map) return;
  
  if (showTraffic && trafficLayer) {
    trafficLayer.setMap(null);
    setShowTraffic(false);
  } else {
    const traffic = new window.google.maps.TrafficLayer();
    traffic.setMap(map);
    setTrafficLayer(traffic);
    setShowTraffic(true);
  }
}, [map, showTraffic, trafficLayer]);

// Fetch nearby places
const fetchNearbyPlaces = useCallback(async () => {
  if (!map || !userLocation) return;
  
  const service = new window.google.maps.places.PlacesService(map);
  const request = {
    location: { lat: userLocation.lat, lng: userLocation.lng },
    radius: 2000,
    type: ['restaurant', 'gas_station', 'atm', 'convenience_store']
  };
  
  service.nearbySearch(request, (results: any[], status: string) => {
    if (status === 'OK' && results) {
      setNearbyPlaces(results.slice(0, 10)); // Limit to 10 places
    }
  });
}, [map, userLocation]);

// Add to favorites
const toggleFavorite = useCallback((stationId: string) => {
  setFavorites(prev => {
    if (prev.includes(stationId)) {
      return prev.filter(id => id !== stationId);
    } else {
      return [...prev, stationId];
    }
  });
}, []);

// Global functions for info window buttons
useEffect(() => {
  (window as any).toggleNearbyPlaces = () => {
    setShowNearbyPlaces(prev => !prev);
    if (!showNearbyPlaces) {
      fetchNearbyPlaces();
    }
  };
  
  (window as any).shareLocation = () => {
    if (navigator.share && userLocationData) {
      navigator.share({
        title: 'My Location',
        text: `I'm currently at: ${userLocationData.address}`,
        url: `https://maps.google.com/?q=${userLocationData.lat},${userLocationData.lng}`
      });
    } else if (userLocationData) {
      navigator.clipboard.writeText(
        `https://maps.google.com/?q=${userLocationData.lat},${userLocationData.lng}`
      );
      alert('Location link copied to clipboard!');
    }
  };
}, [showNearbyPlaces, fetchNearbyPlaces, userLocationData]);

    const CompactMapControls = () => (
  <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5 select-none">
    {/* Combined Controls */}
    <div className={`backdrop-blur-xl rounded-xl shadow-xl border transition-all duration-300 ${
      darkMode 
        ? 'bg-gray-900/85 border-gray-700/30' 
        : 'bg-white/90 border-white/30'
    }`}>
      {/* Map Types - Horizontal */}
      <div className="flex border-b border-gray-200/20">
        {['Map', 'Sat', 'Hyb'].map((label, idx) => {
          const types = ['roadmap', 'satellite', 'hybrid'];
          return (
            <button 
              key={label}
              onClick={() => changeMapType(types[idx])}
              className={`px-2 py-1.5 text-xs font-medium transition-all duration-200 ${
                idx === 0 ? 'rounded-tl-xl' : idx === 2 ? 'rounded-tr-xl' : ''
              } ${
                darkMode
                  ? 'text-white hover:bg-white/10'
                  : 'text-gray-700 hover:bg-black/5'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
      
      {/* Zoom + Actions */}
      <div className="flex">
        <button onClick={zoomIn} className={`px-2 py-1.5 text-sm transition-all ${darkMode ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-black/5'}`}>+</button>
        <button onClick={zoomOut} className={`px-2 py-1.5 text-sm transition-all ${darkMode ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-black/5'}`}>−</button>
        <button 
          onClick={() => userLocation && map && (map.panTo(userLocation), map.setZoom(15))}
          className={`px-2 py-1.5 transition-all ${darkMode ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-black/5'}`}
        >
          <MapPin className="h-3 w-3" />
        </button>
        <button 
          onClick={toggleTrafficLayer}
          className={`px-2 py-1.5 text-xs rounded-br-xl transition-all ${
            showTraffic 
              ? 'bg-blue-500 text-white' 
              : darkMode ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-black/5'
          }`}
        >
          T
        </button>
      </div>
    </div>

    {/* Weather - Separate */}
    {weatherData && (
      <div className={`backdrop-blur-xl rounded-xl shadow-xl border p-2 transition-all ${
        darkMode ? 'bg-gray-900/85 border-gray-700/30' : 'bg-white/90 border-white/30'
      }`}>
        <div className="flex items-center gap-1.5">
          <CloudRain className={`h-3 w-3 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
          <span className={`text-xs font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {weatherData.temperature}°C
          </span>
        </div>
      </div>
    )}
  </div>
);

// Media query component selector
const CustomMapControls = () => (
  <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5 select-none">
    {/* Add your custom controls here, or reuse CompactMapControls for now */}
    <CompactMapControls />
  </div>
);

const ResponsiveMapControls = () => {
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 640 : false);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return isMobile ? <CompactMapControls /> : <CustomMapControls />;
};

  // MAPS RELATED - END

  return (
    <div className={`min-h-screen  flex flex-col ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b shadow-sm`}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo and title */}
            <div className="flex items-center space-x-2">
              <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                <MenuIcon className="h-6 w-6" />
              </button>
              <div className="flex items-center">
                
                <h1 className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent ml-2">
                  RefineGo
                </h1>
              </div>
            </div>
            
            {/* Search bar - hidden on mobile, shown on larger screens */}
            <div className="hidden md:block relative max-w-md w-full">
              <input
                type="text"
                placeholder="Search for stations or addresses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 placeholder:text-[11px] py-2 rounded-full border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            
            {/* User actions */}
            <div className="flex items-center space-x-3">
              <button 
                onClick={toggleDarkMode} 
                className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-yellow-300' : 'bg-gray-100 text-gray-700'}`}
              >
                {darkMode ? <Sun className="h-3 w-6" /> : <Moon className="h-3 w-6" />}
              </button>
              
              <div className="relative inline-block">
                <button
                  onClick={() => {
                    // Toggle on mobile only
                    if (window.innerWidth < 768) setShow(prev => !prev);
                  }}
                  onMouseEnter={() => {
                    if (window.innerWidth >= 768) setShow(true);
                  }}
                  onMouseLeave={() => {
                    if (window.innerWidth >= 768) setTimeout(() => setShow(false), 500);
                  }}
                  className={`p-2 rounded-full relative ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                >
                  <Bell className="h-3 w-5" />
                  {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full transform translate-x-1/2 -translate-y-1/2 z-50">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {show && (
                  <div
                    className={`absolute right-0 mt-2 w-72 rounded-xl shadow-lg z-50 p-4 ${
                      darkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-800'
                    }`}
                    onMouseEnter={() => {
                      if (window.innerWidth >= 768) setShow(true);
                    }}
                    onMouseLeave={() => {
                      if (window.innerWidth >= 768) setShow(false);
                    }}
                  >
                    <h3 className="font-semibold text-sm mb-2">Price Alerts</h3>

                    {loadingNotifications ? (
                      <p className="text-xs text-gray-500">Loading...</p>
                    ) : notificationsError ? (
                      <p className="text-xs text-red-500">{notificationsError}</p>
                    ) : notifications.length === 0 ? (
                      <p className="text-xs text-gray-500">No price alerts</p>
                    ) : (
                      <ul className="max-h-60 overflow-y-auto">
                        {notifications.map((n: any) => (
                          <li key={n.id} className="text-sm border-b py-2">
                            <p className="font-medium">{n.title}</p>
                            <p className="text-xs text-gray-500">{n.message}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              <button className={`hidden md:block p-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <Settings className="h-3 w-5" />
              </button>
              
              <Link href="/Login">
                <div className="w-11 h-7 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center cursor-pointer">
                  <User className="h-3 w-3 text-white" />
                </div>
              </Link>
            </div>
          </div>
          
          {/* Mobile search - visible only on mobile */}
          <div className="mt-3 md:hidden relative">
            <input
              type="text"
              placeholder="Search stations or addresses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-full border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500 `}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className={`fixed inset-0 z-40 transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className={`w-64 h-full ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center">
                <Droplet className="h-6 w-6 text-blue-500" />
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent ml-2">
                  RefineGo
                </h1>
              </div>
              <button onClick={() => setIsMenuOpen(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4">
              <nav className="space-y-2">
                {[
                  { icon: Home, label: 'Home' },
                  { icon: MapPin, label: 'Find Stations' },
                  { icon: Fuel, label: 'My Vehicles' },
                  { icon: Route, label: 'Trip Planner' },
                  { icon: DollarSign, label: 'Price Alerts' },
                  { icon: TrendingUp, label: 'Analytics' },
                  { icon: Settings, label: 'Settings' },
                ].map((item, index) => (
                  <a 
                    key={index} 
                    href="#" 
                    className={`flex items-center space-x-3 p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </a>
                ))}
              </nav>
            </div>
          </div>
          <div 
            className="bg-black bg-opacity-50 h-full w-full" 
            onClick={() => setIsMenuOpen(false)}
          ></div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-grow flex flex-col md:flex-row">
        {/* Sidebar with station list */}
        <div className={`w-full md:w-1/3 lg:w-1/4 border-r ${darkMode ? 'border-gray-700' : 'border-gray-200'} overflow-y-auto`}>
          {/* Filters */}
          <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold">Filters</h2>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-1 text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}
              >
                <Filter className="h-4 w-4" />
                <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
                <ChevronDown className={`h-4 w-4 transform ${showFilters ? 'rotate-180' : ''} transition-transform`} />
              </button>
            </div>
            
            {/* Fuel type selection */}
            <div className="mb-3">
              <label className="block text-sm font-medium mb-2">Fuel Type</label>
              <div className="flex space-x-2">
                {(['regular', 'premium', 'diesel'] as FuelType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFuelType(type)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      fuelType === type 
                        ? 'bg-blue-500 text-white' 
                        : `${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Extended filters */}
            {showFilters && (
              <div className="space-y-3 mt-3">
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      checked={filters.openNow}
                      onChange={() => setFilters({...filters, openNow: !filters.openNow})}
                      className="rounded text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-sm">Open Now</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      checked={filters.atm}
                      onChange={() => setFilters({...filters, atm: !filters.atm})}
                      className="rounded text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-sm">ATM</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      checked={filters.shop}
                      onChange={() => setFilters({...filters, shop: !filters.shop})}
                      className="rounded text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-sm">Shop</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      checked={filters.coffee}
                      onChange={() => setFilters({...filters, coffee: !filters.coffee})}
                      className="rounded text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-sm">Coffee</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      checked={filters.evCharging}
                      onChange={() => setFilters({...filters, evCharging: !filters.evCharging})}
                      className="rounded text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-sm">EV Charging</span>
                  </label>
                </div>
                
                <div className="pt-2">
                  <button 
                    onClick={() => setFilters({atm: false, shop: false, coffee: false, evCharging: false, openNow: true})}
                    className={`text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Station list */}
          <div className="max-h-[650px] overflow-y-auto scrollbar-hide divide-y divide-gray-200">
            {filteredStations.length > 0 ? (
              filteredStations.map((station) => (
                <div 
                  key={station.id}
                  onClick={() => setSelectedStation(station)}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedStation && selectedStation.id === station.id 
                      ? (darkMode ? 'bg-blue-900 bg-opacity-20' : 'bg-blue-50') 
                      : (darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100')
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{station.name}</h3>
                      <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{station.address}</p>
                      <div className="flex items-center mt-1 space-x-2">
                        <span className={`text-sm ${station.isOpen ? 'text-green-500' : 'text-red-500'}`}>
                          {station.isOpen ? 'Open' : 'Closed'}
                        </span>
                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>•</span>
                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{station.distance} km</span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-bold text-lg">R{getPrice(station)}</div>
                      <div className="flex items-center mt-1 justify-end">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="ml-1 text-sm">{station.rating}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Amenities */}
                  <div className="mt-3 flex space-x-2">
                    {station.hasATM && (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                        darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                      }`}>
                        <CreditCard className="h-3 w-3 mr-1" />
                        ATM
                      </span>
                    )}
                    {station.hasShop && (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                        darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                      }`}>
                        <Shopping className="h-3 w-3 mr-1" />
                        Shop
                      </span>
                    )}
                    {station.hasCoffee && (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                        darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                      }`}>
                        <Coffee className="h-3 w-3 mr-1" />
                        Coffee
                      </span>
                    )}
                    {station.hasEVCharging && (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                        darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                      }`}>
                        <Zap className="h-3 w-3 mr-1" />
                        EV
                      </span>
                    )}
                  </div>
                  
                  {/* Busy indicator */}
                  <div className="mt-3 flex items-center">
                    <div className={`h-2 w-2 rounded-full ${getBusyLevelColor(station.busyLevel)} mr-2`}></div>
                    <span className="text-xs">{getBusyLevelText(station.busyLevel)}</span>
                    {station.waitTime > 0 && (
                      <>
                        <span className="mx-1">•</span>
                        <Clock className="h-3 w-3 mr-1" />
                        <span className="text-xs">{station.waitTime} min wait</span>
                      </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center">
                <Info className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                <h3 className="font-medium mb-1">No stations found</h3>
                <p className="text-sm text-gray-500">Try adjusting your filters or search query</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Floating Map Controls */}
      <div className="absolute top-50 right-4 z-10 space-y-2">        

        </div>
        {/* Map area */}
        <div className="flex-grow relative">
          {/* Placeholder for map - in a real app, this would be a mapping component */}
          <div className={`h-full w-full ${darkMode ? 'bg-gray-800' : 'bg-gray-200'} flex items-center justify-center`}>
            {/* Map placeholder */}
            <div className="text-center p-8">
              <div className="flex-grow relative">
              {/* Loading overlay */}
              {!isMapLoaded && (
                <div className={`absolute inset-0 z-20 flex items-center justify-center ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-lg font-medium">Loading Map...</p>
                  </div>
                </div>
              )}
              
              {/* Google Map Container */}
              <div 
                ref={mapRef} 
                className="w-full h-full rounded-2xl mb-2 overflow-hidden shadow-lg"
                style={{ minHeight: '400px', maxWidth: '100%' }}
              />

              {/* Map Controls */}
              <div className="absolute -top-5 -left-5 z-10 space-y-2">
                <CustomMapControls />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-lg mx-auto">
                {filteredStations.map((station) => (
                  <div key={station.id} className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'} shadow`}>
                    <div className={`h-2 ${getBusyLevelColor(station.busyLevel)} rounded-full mb-2`}></div>
                    <div className="text-xs font-semibold mb-1">{station.name}</div>
                    <div className="text-xs">R{getPrice(station)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
          
          {/* Selected station details - appears when station is selected */}
          {selectedStation && (
            <div
                className={`absolute bottom-0 left-0 right-0 p-4 ${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                } shadow-lg rounded-t-xl border-t ${
                  darkMode ? 'border-gray-700' : 'border-gray-200'
                } h-83 overflow-y-auto scrollbar-hide`}
              >
                <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-bold text-lg">{selectedStation.name}</h2>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{selectedStation.address}</p>
                  
                  <div className="flex items-center mt-2 space-x-3">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="ml-1">{selectedStation.rating}</span>
                    </div>
                    <span>•</span>
                    <span>{selectedStation.distance} km away</span>
                    <span>•</span>
                    <div className="flex items-center">
                      <div className={`h-2 w-2 rounded-full ${getBusyLevelColor(selectedStation.busyLevel)} mr-2`}></div>
                      <span>{getBusyLevelText(selectedStation.busyLevel)}</span>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => setSelectedStation(null)}
                  className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* Prices */}
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div className="text-sm">Regular</div>
                  <div className="font-bold text-lg">R{selectedStation.regularPrice}</div>
                </div>
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div className="text-sm">Premium</div>
                  <div className="font-bold text-lg">R{selectedStation.premiumPrice}</div>
                </div>
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div className="text-sm">Diesel</div>
                  <div className="font-bold text-lg">R{selectedStation.dieselPrice}</div>
                </div>
              </div>
              
              {/* Amenities and Actions */}
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedStation.hasATM && (
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                    darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                  }`}>
                    <CreditCard className="h-4 w-4 mr-1" />
                    ATM
                  </span>
                )}
                {selectedStation.hasShop && (
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                    darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                  }`}>
                    <Shopping className="h-4 w-4 mr-1" />
                    Shop
                  </span>
                )}
                {selectedStation.hasCoffee && (
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                    darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                  }`}>
                    <Coffee className="h-4 w-4 mr-1" />
                    Coffee
                  </span>
                )}
                {selectedStation.hasEVCharging && (
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                    darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                  }`}>
                    <Zap className="h-4 w-4 mr-1" />
                    EV Charging
                  </span>
                )}
              </div>
              
              {/* Action buttons */}
              {selectedStation && (
              <div className="mt-4 space-y-3">
                {/* Main Action Buttons */}
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => calculateRoute(selectedStation)}
                    disabled={isNavigating}
                    className={`flex-1 h-12 rounded-full font-light text-white text-xs px-4 flex items-center justify-center transition-all duration-200 hover:scale-105
                      ${isNavigating
                        ? 'bg-[oklch(54.6%_0.245_262.881)] cursor-not-allowed'
                        : 'bg-[oklch(54.6%_0.245_262.881)] hover:bg-[oklch(54.6%_0.245_262.881)] active:scale-95'}`}
                  >
                    {isNavigating ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Navigating...
                      </>
                    ) : (
                      <>
                      <Navigation className="h-3 w-3 mr-1" />
                      Navigate
                    </>
                    )}
                  </button>

                  {(() => {
                    const isFavorite = favorites.includes(selectedStation.id);
                    return (
                      <button
                        onClick={() => toggleFavorite(selectedStation.id)}
                        className="h-12 w-12 rounded-full font-light flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95
                                  bg-[#ff593c] hover:bg-[#ff593c] text-white shadow-lg"
                      >
                        <svg 
                          className="w-3 h-3" 
                          fill={isFavorite ? "currentColor" : "none"} 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" 
                          />
                        </svg>
                      </button>
                    );
                  })()}
                </div>
                
                {/* Additional Feature Buttons */}
                <div className="flex gap-2 mt-3 justify-start">
                  {/* Traffic Button */}
                  <button 
                    onClick={toggleTrafficLayer}
                    className={`flex h-12 w-24 items-center justify-center gap-2 px-4 py-2 rounded-full text-xs font-small transition-all duration-200 hover:scale-105
                      ${showTraffic ? 'bg-[#ff593c]' : 'bg-[#2edda2]'} text-white shadow-md dark:text-white`}
                  >
                    <img 
                      src="https://img.icons8.com/?size=100&id=16699&format=png&color=FFFFFF" 
                      alt="Traffic Icon" 
                      className={`h-4 w-4 transition-all duration-300 
                        ${showTraffic ? 'animate-glow drop-shadow-[0_0_6px_rgba(255,89,60,0.8)]' : ''}`} 
                    />
                    Traffic
                  </button>

                  {/* Share Button */}
                  <button 
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: selectedStation.name,
                          text: `Check out ${selectedStation.name} - R${getPrice(selectedStation)} per liter`,
                          url: `https://maps.google.com/?q=${selectedStation.coordinates.lat},${selectedStation.coordinates.lng}`
                        });
                      }
                    }}
                    className={`flex items-center justify-center h-12 w-24 gap-2 px-4 py-2 rounded-full text-xs font-small transition-all duration-200 hover:scale-105
                      ${darkMode 
                        ? 'bg-[#2edda2] text-white' 
                        : 'bg-[#2edda2] text-white'}`}
                  >
                    <img 
                      src="https://img.icons8.com/?size=100&id=mbbuOVGwvhrI&format=png&color=FFFFFF" 
                      alt="Share Icon" 
                      className="h-4 w-4" 
                    />
                    Share
                  </button>
                </div>
            {/* Route Information Panel */}
          {routeData && (
            <div className={`border-none rounded-xl p-4 mt-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              {/* Header */}
              <div className="flex items-center justify-between mb-1">
                <div>
                  <h4 className={`font-normal text-[13px] text-[#2edda2] ${darkMode ? 'text-white' : 'text-[#2edda2]'}`}>Navigating Route to {selectedStation.name} fuel Station</h4>
                  <p className={`text-[11px] mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Navigation ready</p>
                </div>
                <button 
                  onClick={stopNavigation}
                  className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              {/* Route Stats */}
              <div className={`flex items-center justify-start gap-8 py-4 mb-4 rounded-lg ${darkMode ? 'bg-transparent' : 'bg-transparent'}`}>
                <div className="text-center">
                  <div className={`text-xs font-lighter ${darkMode ? 'text-white' : 'text-gray-400'}`}>{routeData.distance}</div>
                  <div className={`text-[10px] font-small mt-1 ${darkMode ? 'text-[#2edda2]' : 'text-[#2edda2]'}`}>Distance</div>
                </div>
                <div className="text-center">
                  <div className={`text-xs font-lighter ${darkMode ? 'text-white' : 'text-gray-400'}`}>{routeData.duration}</div>
                  <div className={`text-[10px] font-small mt-1 ${darkMode ? 'text-[#2edda2]' : 'text-[#2edda2]'}`}>Duration</div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2 -mt-4 mb-5 justify-start">
                {/* Show/Hide Directions Button */}
                <button 
                  onClick={() => setShowRouteOptions(!showRouteOptions)}
                  className={`h-9 w-20 flex items-center justify-center -ml-3 gap-2 px-4 py-2 rounded-full text-xs font-small transition-all duration-200 hover:scale-105
                    bg-[#2edda2] text-white shadow-md`}
                >
                  {showRouteOptions ? 'Hide' : 'Show'}
                </button>

                {/* Open Maps Button */}
                <button 
                  onClick={() =>
                    window.open(
                      `https://www.google.com/maps/dir/?api=1&origin=${userLocation?.lat},${userLocation?.lng}&destination=${selectedStation.coordinates.lat},${selectedStation.coordinates.lng}&travelmode=driving`,
                      '_blank'
                    )
                  }
                  className={`h-9 w-20 flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs font-small transition-all duration-200 hover:scale-105
                    ${darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'} shadow-md`}
                >
                  Maps
                </button>
              </div>

              
              {/* Step-by-step directions */}
              {showRouteOptions && routeData.steps && (
                <div className={`border-t pt-4 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h5 className={`font-small text-[11px] ${darkMode ? 'text-white' : 'text-gray-400'}`}>Directions</h5>
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {routeData.steps.length} steps
                    </span>
                  </div>
                  
                  <div className="space-y-4 max-h-80 overflow-y-auto">
                    {routeData.steps.slice(0, 5).map((step, index) => (
                      <div 
                        key={index} 
                        className="flex items-start gap-3"
                      >
                        {/* Step Number */}
                        <div className="flex-shrink-0 mt-0.5">
                          <div className={`w-4 h-4 border rounded-full flex items-center justify-center bg-white ${darkMode ? 'border-[#2edda2] bg-[#2edda2]' : 'border-[#2edda2]'}`}>
                            <span className={`text-[9px] font-light font-small ${darkMode ? 'text-[#2edda2]' : 'text-[#2edda2]'}`}>{index + 1}</span>
                          </div>
                        </div>

                        {/* Step Content */}
                        <div className="flex-1 pb-2">
                          <p className={`text-[11px] leading-relaxed mb-2 ${darkMode ? 'text-[#2edda2]' : 'text-[#2edda2]'}`}>
                            {step.instruction}
                          </p>
                          <div className={`flex items-center gap-4 text-[10px] ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                            <span>{step.distance}</span>
                            <span>•</span>
                            <span>{step.duration}</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Show More Indicator */}
                    {routeData.steps.length > 5 && (
                      <div className="text-center py-2">
                        <button className="text-[11px] text-[#2edda2] hover:text-gray-700 font-medium">
                          +{routeData.steps.length - 5} more steps
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Summary */}
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between text-[11px] text-gray-500">
                      <span>Total journey</span>
                      <div className="flex items-center gap-2 font-medium">
                        <span className='text-[#2edda2]'>{routeData.distance}</span>
                        <span>•</span>
                        <span className='text-[#2edda2]'>{routeData.duration}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
            </div>
          )}
            </div>
          )}
          
          {/* Quick actions floating button */}
          <div className="absolute bottom-4 right-4 z-10">
            <div className="relative group">
              <button className={`h-14 w-14 rounded-full bg-blue-500 text-white shadow-lg flex items-center justify-center hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}>
                <Plus className="h-6 w-6" />
              </button>
              
              <div className="absolute bottom-16 right-0 hidden group-hover:flex flex-col-reverse items-end space-y-reverse space-y-2">
                {[
                  { icon: Bell, label: 'Set Price Alert' },
                  { icon: Clock, label: 'Wait Time' },
                  { icon: Route, label: 'Plan Trip' },
                  { icon: RefreshCw, label: 'Update Prices' }
                ].map((action, index) => (
                  <div key={index} className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg">
                    <span className="whitespace-nowrap">{action.label}</span>
                    <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                      <action.icon className="h-4 w-4 text-white" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Legend for map */}
          <div className="absolute top-4 right-4 z-10">
            <div className={`p-3 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h4 className="font-medium text-sm mb-2">Price Legend</h4>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span className="text-xs">Lowest price</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                  <span className="text-xs">Average price</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                  <span className="text-xs">Highest price</span>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </main>

      {/* Bottom navigation for mobile */}
      <nav className={`md:hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t`}>
        <div className="flex justify-around py-2">
          {[
            { icon: Home, label: 'Home' },
            { icon: MapPin, label: 'Find' },
            { icon: Fuel, label: 'Vehicles' },
            { icon: Route, label: 'Trips' },
            { icon: User, label: 'Profile' }
          ].map((item, index) => (
            <button key={index} className="flex flex-col items-center py-1 px-3">
              <item.icon className="h-6 w-6 mb-1" />
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

// Dummy component for Shopping icon since it wasn't imported
interface ShoppingProps extends React.SVGProps<SVGSVGElement> {}

const Shopping: React.FC<ShoppingProps> = (props) => (
  <svg 
    {...props}
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <path d="M16 10a4 4 0 0 1-8 0"></path>
  </svg>
);

// Missing Navigation component
interface NavigationProps extends React.SVGProps<SVGSVGElement> {}

const Navigation: React.FC<NavigationProps> = (props) => (
  <svg 
    {...props}
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
  </svg>
);

export default PetrolFinderPage;