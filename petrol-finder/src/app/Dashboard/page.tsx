"use client";

import Link from 'next/link';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useRef, useCallback} from 'react';
import BottomNav from '../components/mainBottomNav'
import ProfileAvatar from '../components/profileAvatar'
import TutorialModal from '../components/TutorialModal';
import NearestStationPopup from '../components/NearestStationPopup';
import {SafetyModal, SupportModal, AboutModal, BaseModal } from '../components/NavModals';
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
  Menu,
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
  Phone,
  Wallet, Gift,  
  Shield, Briefcase, HelpCircle
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

interface PersistedRouteData {
  destination: {
    coordinates: {
      lat: number;
      lng: number;
    };
    name: string;
    id: string;
    [key: string]: any;
  };
  routeInfo: {
    distance: string;
    duration: string;
    steps: Array<{
      instruction: string;
      distance: string;
      duration: string;
      maneuver: string;
    }>;
    polyline: string;
  };
  timestamp: number;
  userLocation: {
    lat: number;
    lng: number;
  };
}

type FuelType = 'regular' | 'premium' | 'diesel';

// Add this component before PetrolFinderPage
interface ShowNearestStationButtonProps {
  onClick: () => void;
}
const ShowNearestStationButton: React.FC<ShowNearestStationButtonProps> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="fixed bottom-24 right-4 z-40 bg-[#2edda2] text-white px-4 py-2 rounded-full h-11 w-11 shadow-lg flex items-center gap-2 transition-all hover:scale-105"
    style={{ display: 'flex', alignItems: 'center' }}
    aria-label="Show nearest station"
  >
    <Navigation className="h-4 w-4" />
  </button>
);

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

  const [showNearestStationPopup, setShowNearestStationPopup] = useState(false);

  // API related state
  const [petrolStations, setPetrolStations] = useState<PetrolStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [showSideNav, setShowSideNav] = useState(false);
  const router = useRouter();
  
  // Persistance related state
  const [persistedRoute, setPersistedRoute] = useState<PersistedRouteData | null>(null);
  const [isRestoringRoute, setIsRestoringRoute] = useState(false);
  
  // Maps related state
  const [map, setMap] = useState<GoogleMap | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<GoogleMapsMarker[]>([]);

  // modals Retaltes state
  const [activeModal, setActiveModal] = useState<'safety' | 'support' | 'about' | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [open, setOpen] = useState(false)

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
  const [favorites, setFavorites] = useState<{ google_place_id: string }[]>([]);
  const [showRouteOptions, setShowRouteOptions] = useState(false);
  const [trafficLayer, setTrafficLayer] = useState<any>(null);
  const [showTraffic, setShowTraffic] = useState(false);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  //Routing related states
  const [currentTrip, setCurrentTrip] = useState<TripData | null>(null);
  const [showTripCompleteModal, setShowTripCompleteModal] = useState(false);
  interface TripCompleteData {
    trip: {
      actual_distance: number;
      actual_duration: number;
      [key: string]: any;
    };
    points_awarded: number;
    points_breakdown: {
      reasons: string[];
      [key: string]: any;
    };
    user_profile: {
      total_points: number;
      loyalty_tier: string;
      [key: string]: any;
    };
    achievements?: {
      icon: string;
      title: string;
      description: string;
      [key: string]: any;
    }[];
    [key: string]: any;
  }
  const [tripCompleteData, setTripCompleteData] = useState<TripCompleteData | null>(null);
  const [destinationReached, setDestinationReached] = useState(false);
  const [tripStartTime, setTripStartTime] = useState<Date | null>(null);
  const [totalTripDistance, setTotalTripDistance] = useState(0);

  const [isDesktop, setIsDesktop] = useState(false);

  const navItems = [
  { icon: <Route size={35} />, label: 'My Trips', onClick: () => router.push('/Stats'), badge: 'NEW' },
  { icon: <Shield size={35} />, label: 'Safety', onClick: () => openModal('safety') },
  { icon: <HelpCircle size={35} />, label: 'Support', onClick: () => openModal('support'), badge: 'NEW' },
  { icon: <Info size={35} />, label: 'About', onClick: () => openModal('about') },
  ];
  
  const actions = [
    { icon: <Route size={20} />, label: 'My Trips', onClick: () => router.push('/Stats'), badge: 'NEW' },
    { icon: <Shield size={20} />, label: 'Safety', onClick: () => openModal('safety') },
    { icon: <HelpCircle size={20} />, label: 'Support', onClick: () => openModal('support'), badge: 'NEW' },
    { icon: <Info size={20} />, label: 'About', onClick: () => openModal('about') },
  ]

  interface User {
    username: string;
    // Add other user properties if needed
    [key: string]: any;
  }

  interface SideUser {
    name: string;
    username: string;
    email: string;
    profile_picture: string | null;
}
  const [user, setUser] = useState<User | null>(null);
  const [SideUser, setSideUser] = useState<SideUser | null>(null);
  const [csrfToken, setCsrfToken] = useState("");
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://refine-go.onrender.com';
  //User fetch

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

  // Modals open and close
  const openModal = (modalType: 'safety' | 'support' | 'about') => {
      setActiveModal(modalType);
    };

    const closeModal = () => {
      setActiveModal(null);
    };
  
  useEffect(() => {
    const checkScreen = () => setIsDesktop(window.innerWidth >= 768); // Tailwind's 'md' breakpoint

    checkScreen(); // initial check
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

 useEffect(() => {
  const timer = setTimeout(() => {
    setShowNearestStationPopup(true);
  }, 1000); // Show after 1 second

  return () => clearTimeout(timer);
}, []);


  const handleCloseNearestStationPopup = () => {
    setShowNearestStationPopup(false);
  };

  const handleShowNearestStationPopup = () => {
    setShowNearestStationPopup(true);
  };

  const visibleStations = filteredStations.slice(0, isDesktop ? 8 : 4);

  useEffect(() => {
      const fetchCsrfToken = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/csrf-token/`, {
            credentials: 'include',
          });
          const data = await response.json();
          setCsrfToken(data.csrfToken);
        } catch (error) {
          console.error('Failed to fetch CSRF token:', error);
        }
      };
  
      fetchCsrfToken();
    }, []);

  async function fetchUser() {
  setLoading(true);
  setError(null);
  try {
    const res = await fetch(`${API_BASE_URL}/api/logged_user`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      credentials: 'include', // important for session cookie
    });
    const data = await res.json();
    if (data.authenticated) {
      setUser(data.user);
    } else {
      setUser(null);
    }
  } catch (e) {
    setError('Failed to fetch user info');
    setUser(null);
  }
  setLoading(false);
}

async function fetchUserProfile() {
  setLoading(true);
  setError(null);

  try {
    const res = await fetch(`${API_BASE_URL}/api/api/get-profile/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken, // Use your existing token variable
      },
      credentials: 'include', // Ensure cookies are sent
    });

    const data = await res.json();
    console.log('User data:', data);

    if (res.ok && data && data.username) {
      // Assume the presence of a username or similar key means authenticated
      setSideUser(data);
    } else {
      setSideUser(null);
    }
  } catch (error) {
    console.error('Failed to fetch user info:', error);
    setError('Failed to fetch user info');
    setSideUser(null);
  }

  setLoading(false);
}


// Updated handlers for user menu that preserve your fetch logic
const handleUserMouseEnter = () => {
    if (window.innerWidth >= 768) {
      setShowUserMenu(true);
      fetchUser(); // Fetch user data when hovering
    }
  };

const handleUserMouseLeave = () => {
  if (window.innerWidth >= 768) {
    setShowUserMenu(false);
  }
};

const handleUserClick = () => {
  if (!user) {
    // If user is not logged in, redirect to login page
    window.location.href = '/Login'; // or use a router.push('/login') if you're using Next.js
    return;
  }

  if (window.innerWidth < 768) {
    setShowUserMenu(prev => !prev);
  }
};


  // Modal ref for user dropdown/modal
  const modalRef = useRef<HTMLDivElement | null>(null);

  // Optional: close modal if clicked outside (desktop)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modalRef.current &&
        event.target &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setShow(false);
      }
    }
    if (show) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [show]);


type Favorites = {
  google_place_id: string;
  // other fields if needed
};

  // Memoized filtered stations to prevent unnecessary re-renders

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
          maximumAge: 5000 // 5 minutes
        }
      );
    });
  }, []);

  // Wheather fecth function
  const fetchWeatherData = useCallback(async (lat: number, lng: number): Promise<WeatherData | null> => {
  try {
    const username = 'refinego_goyou_refine'; // Replace with actual credentials
    const password = 'Fv8gXti85A'; // Replace with actual credentials
    const url = `https://api.meteomatics.com/2025-06-05T00:00:00Z--2025-06-06T00:00:00Z:PT1H/t_2m:C/${lat},${lng}/json`;

    const response = await fetch(url, {
      headers: {
        'Authorization': 'Basic ' + btoa(username + ':' + password)
      }
    });

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
      temperature: data.data[0].coordinates[0].dates[0].value,
      condition: 'Unknown', // Meteomatics might require additional queries for condition info
      humidity: 65, // Humidity might need a separate API request
      windSpeed: 12, // Adjust this if wind data is needed
      visibility: 10, // Meteomatics may not provide visibility directly
      icon: '01d' // Custom logic for icon mapping may be needed
    };
  } catch (error) {
    console.error('Weather fetch failed:', error);
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

const isLoading = loading || !isMapLoaded;

  // Fetch petrol stations from API
  const fetchPetrolStations = useCallback(async (location: UserLocation, radius: number = 5) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `${API_BASE_URL}/api/api/petrol-stations/nearby_with_real_data/?lat=${location.lat}&lng=${location.lng}&radius=${radius}`,
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
          <div class="bg-white rounded-lg p-3 sm:p-4 w-full max-w-sm mx-auto max-h-[90vh] sm:max-h-[320px] overflow-y-auto shadow-lg scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-base sm:text-lg font-semibold text-gray-800">Your Location</h3>
              ${weatherData ? `<div class="flex items-center text-blue-600">
                <span class="text-xl sm:text-2xl mr-1">${weatherData.temperature}°C</span>
              </div>` : ''}
            </div>

            <p class="text-xs sm:text-sm text-gray-600 mb-3 break-words">${userLocationData.address}</p>

            ${weatherData ? `
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div class="flex items-center">
                  <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                    <svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z"/>
                    </svg>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="text-xs text-gray-500">Condition</div>
                    <div class="text-sm font-medium truncate">${weatherData.condition}</div>
                  </div>
                </div>

                <div class="flex items-center">
                  <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                    <svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                    </svg>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="text-xs text-gray-500">Humidity</div>
                    <div class="text-sm font-medium">${weatherData.humidity}%</div>
                  </div>
                </div>
              </div>
            ` : ''}

            <div class="flex flex-col sm:flex-row gap-2 mt-3">
              <button onclick="window.toggleNearbyPlaces()" class="w-full bg-blue-500 text-white text-sm py-2 px-3 rounded-lg hover:bg-blue-600 transition-colors">
                Nearby Places
              </button>
              <button onclick="window.shareLocation()" class="w-full bg-gray-500 text-white text-sm py-2 px-3 rounded-lg hover:bg-gray-600 transition-colors">
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

      const response = await fetch('https://refine-go.onrender.com/api/i/notifications/', {
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
      const newMode = !darkMode;
      setDarkMode(newMode);
      document.documentElement.classList.toggle('dark');
  
      // Save preference to localStorage
      localStorage.setItem('darkMode', newMode.toString());
    };
  
    useEffect(() => {
    const savedMode = localStorage.getItem('darkMode') === 'true';
  
      setDarkMode(savedMode);
  
      if (savedMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }, []);

  // Helper functions
  const getBusyLevelColor = (level: string): string => {
    const colorMap: { [key: string]: string } = {
      low: "bg-green-500",
      medium: "bg-yellow-500",
      high: "bg-red-500",
    };
    return colorMap[level] || "bg-gray-500";
  };

  const getBusyLevelColorBelow = (level: string): string => {
    const colorMap: { [key: string]: string } = {
      low: "bg-green-500",
      medium: "bg-[#2edda2]",
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
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyC6HAREudAh22_9dByPF-20I1HDvJBFdb8&libraries=places`;
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
    streetViewControl: false,
    rotateControl: false,
    fullscreenControl: false,
    keyboardShortcuts: false, 
    gestureHandling: 'greedy',
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
  
const createCustomMarker = useCallback(
  (station: PetrolStation, isSelected: boolean = false, favorites: { google_place_id: string }[] = []) => {
    if (!window.google) return null;

  const isFavorite = favorites.some(fav => fav.google_place_id === station.id);
  
  const busyColor = station.busyLevel === 'low' ? '#10B981' : 
                  station.busyLevel === 'medium' ? '#30d5c8' : '#EF4444';
  
  // Modern gas pump icon with rounded container

  const fillColor = isSelected
      ? '#2edda2'
      : isFavorite
        ? '#ff5d9e' // e.g., blue for favorite
        : busyColor;

  const svgMarker =  {
        path: `M6 2h12c1.1 0 2 0.9 2 2v14c0 1.1-0.9 2-2 2h-2v6h-2v-6h-4v6H8v-6H6c-1.1 0-2-0.9-2-2V4c0-1.1 0.9-2 2-2z
              M8 6h8c0.55 0 1 0.45 1 1v8c0 0.55-0.45 1-1 1H8c-0.55 0-1-0.45-1-1V7c0-0.55 0.45-1 1-1z
              M10 8v6
              M14 8v6
              M18 11h4c0.55 0 1 0.45 1 1s-0.45 1-1 1h-4
              M12 28l-4-4h8l-4 4z`,
        fillColor: fillColor,
        fillOpacity: 1,
        strokeWeight: isSelected ? 3 : 2,
        strokeColor: '#FFFFFF',
        scale: isSelected ? 2.5 : 2.0,
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
        icon: createCustomMarker(station, selectedStation?.id === station.id, favorites),
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
        marker.setIcon(createCustomMarker(station, station.id === selectedStation.id, favorites));
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
      setLoading(true); // START

      const location = await getUserLocation();
      setUserLocation(location);
      setLocationError(null);

      await fetchPetrolStations(location);

      if (show) {
        await fetchNotifications();
      }
    } catch (err) {
      console.error('Location error:', err);
      setLocationError(err instanceof Error ? err.message : 'Location access failed');

      const defaultLocation = { lat: -25.754, lng: 28.231 };
      setUserLocation(defaultLocation);
      await fetchPetrolStations(defaultLocation);
    } finally {
      setLoading(false); // END
    }
  };

  initializeData();
}, []);

  

  // Load Google Maps when component mounts
  useEffect(() => {
    loadGoogleMapsScript()
      .then(() => {
        setGoogleMapsLoaded(true);
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

// Enhanced calculateRoute function with trip starting
interface CalculateRouteDestination {
  coordinates: {
    lat: number;
    lng: number;
  };
  name: string;
  [key: string]: any;
}

interface GoogleMapsDirectionsService {
  route: (
    request: google.maps.DirectionsRequest,
    callback: (result: google.maps.DirectionsResult, status: google.maps.DirectionsStatus) => void
  ) => void;
}

interface GoogleMapsDirectionsRenderer {
  setMap: (map: GoogleMap | null) => void;
  setDirections: (directions: google.maps.DirectionsResult) => void;
}

// Function to start trip in backend
interface StartTripDestination {
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  [key: string]: any;
}

interface TripData {
  id: string;
  [key: string]: any;
}

const [selectedVehicleId, setSelectedVehicleId] = useState<string>('default-vehicle-id'); // TODO: Replace with actual logic
const startTrip = async (
  destination: StartTripDestination,
  distance: number,
  duration: number
): Promise<void> => {
  try {
    if (!userLocation?.lat || !userLocation?.lng) {
      throw new Error('User location not available');
    }

    if (!destination.coordinates?.lat || !destination.coordinates?.lng) {
      throw new Error('Destination coordinates not available');
    }

    // Format coordinates
    const formatCoordinate = (coord: number): number => {
      const rounded = Math.round(coord * 1000000) / 1000000;
      return parseFloat(rounded.toFixed(6));
    };

    const requestBody = {
      ...(selectedVehicleId && selectedVehicleId !== "default-vehicle-id" ? { vehicle: selectedVehicleId } : {}),
      start_address: userLocationData?.address || '',
      start_latitude: formatCoordinate(userLocation.lat),
      start_longitude: formatCoordinate(userLocation.lng),
      destination_address: destination.name,
      destination_latitude: formatCoordinate(destination.coordinates.lat),
      destination_longitude: formatCoordinate(destination.coordinates.lng),
      planned_distance: Math.round(distance / 1000 * 100) / 100,
      planned_duration: Math.round(duration / 60),
    };

    const response = await fetch(`${API_BASE_URL}/api/api/trips/create_and_start_trip/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      credentials: 'include',
      body: JSON.stringify(requestBody)
    });
    
    if (response.ok) {
      const tripData: TripData = await response.json();
      setCurrentTrip(tripData);
      setTripStartTime(new Date());
      setTotalTripDistance(0);
      setDestinationReached(false);
    } else {
      const errorData = await response.text();
      console.error('Failed to start trip:', response.status, errorData);
    }
  } catch (error) {
    console.error('Failed to start trip:', error);
  }
};

// Replace the startPositionTracking function with this improved version
interface StartPositionTrackingDestination {
  coordinates: {
    lat: number;
    lng: number;
  };
  [key: string]: any;
}

const startPositionTracking = useCallback(
  (destination: StartPositionTrackingDestination) => {
    if (!navigator.geolocation) return;

    let previousLocation: UserLocation | null = userLocation;

    const watchId: number = navigator.geolocation.watchPosition(
      (position: GeolocationPosition) => {
        const newLocation: UserLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        // Update location state
        setUserLocation(newLocation);

        // Update marker position
        if (userLocationMarker) {
          userLocationMarker.setPosition(newLocation);
        }

        // Calculate trip distance if we have a previous location
        if (previousLocation && currentTrip) {
          const segmentDistance = calculateDistance(
            previousLocation.lat,
            previousLocation.lng,
            newLocation.lat,
            newLocation.lng
          );
          setTotalTripDistance((prev: number) => prev + segmentDistance);
        }

        // Check if user has reached destination (within 100 meters)
        if (destination && !destinationReached) {
          const distanceToDestination = calculateDistance(
            newLocation.lat,
            newLocation.lng,
            destination.coordinates.lat,
            destination.coordinates.lng
          );

          // If within 100 meters of destination
          if (distanceToDestination < 0.1) {
            setDestinationReached(true);
            handleTripCompletion();
          }
        }

        previousLocation = newLocation;
      },
      (error: GeolocationPositionError) => {
        console.error('Position tracking error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );

    setWatchPositionId(watchId);
  },
  [
    userLocationMarker,
    userLocation,
    currentTrip,
    destinationReached,
  ]
);


// (Removed duplicate startPositionTracking function to fix redeclaration error)
const saveRouteToStorage = useCallback((
  destination: any,
  routeInfo: any,
  userLoc: UserLocation
) => {
  try {
    const routeData: PersistedRouteData = {
      destination,
      routeInfo,
      timestamp: Date.now(),
      userLocation: userLoc
    };
    localStorage.setItem('persistedRoute', JSON.stringify(routeData));
    setPersistedRoute(routeData);
  } catch (error) {
    console.error('Failed to save route to storage:', error);
  }
}, []);

const calculateRoute = useCallback(
  async (destination: CalculateRouteDestination) => {
    if (
      !directionsService ||
      !directionsRenderer ||
      !userLocation ||
      !map
    )
      return;

    setIsNavigating(true);

    try {
      const request: google.maps.DirectionsRequest = {
        origin: { lat: userLocation.lat, lng: userLocation.lng },
        destination: {
          lat: destination.coordinates.lat,
          lng: destination.coordinates.lng,
        },
        travelMode: window.google.maps.TravelMode.DRIVING,
        avoidHighways: false,
        avoidTolls: false,
        provideRouteAlternatives: true,
      };

      directionsService.route(
        request,
        async (result: google.maps.DirectionsResult, status: google.maps.DirectionsStatus) => {
          if (status === "OK") {
            directionsRenderer.setMap(map);
            directionsRenderer.setDirections(result);

            const route = result.routes[0];
            const leg = route.legs[0];

            const routeInfo = {
              distance: leg.distance?.text ?? '',
              duration: leg.duration?.text ?? '',
              steps: leg.steps.map((step: google.maps.DirectionsStep) => ({
                instruction: step.instructions.replace(/<[^>]*>/g, ""),
                distance: step.distance ? step.distance.text : '',
                duration: step.duration ? step.duration.text : '',
                maneuver: (step as any).maneuver || "straight",
              })),
              polyline: route.overview_polyline,
            };

            setRouteData(routeInfo);
            setShowRouteOptions(true);

            // Save route to localStorage for persistence
            saveRouteToStorage(destination, routeInfo, userLocation);

            // Start a new trip in the backend
            await startTrip(
              destination, 
              leg.distance?.value ?? 0, 
              leg.duration?.value ?? 0
            );

            // Start watching position for live updates
            startPositionTracking(destination);
          } else {
            console.error("Route calculation failed:", status);
            alert("Could not calculate route. Please try again.");
            setIsNavigating(false);
          }
        }
      );
    } catch (error) {
      console.error("Route error:", error);
      setIsNavigating(false);
    }
  },
  [
    directionsService,
    directionsRenderer,
    userLocation,
    map,
    saveRouteToStorage,
    startTrip,
    startPositionTracking,
  ]
);

const loadRouteFromStorage = useCallback((): PersistedRouteData | null => {
  try {
    const stored = localStorage.getItem('persistedRoute');
    if (!stored) return null;
    
    const routeData: PersistedRouteData = JSON.parse(stored);
    
    // Check if route is not too old (e.g., 24 hours)
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    if (Date.now() - routeData.timestamp > maxAge) {
      localStorage.removeItem('persistedRoute');
      return null;
    }
    
    return routeData;
  } catch (error) {
    console.error('Failed to load route from storage:', error);
    localStorage.removeItem('persistedRoute');
    return null;
  }
}, []);

const clearPersistedRoute = useCallback(() => {
  try {
    localStorage.removeItem('persistedRoute');
    setPersistedRoute(null);
  } catch (error) {
    console.error('Failed to clear persisted route:', error);
  }
}, []);

// Enhanced route restoration function
const restorePersistedRoute = useCallback(async () => {
  if (!map || !directionsService || !directionsRenderer || isRestoringRoute) return;
  
  const storedRoute = loadRouteFromStorage();
  if (!storedRoute || !userLocation) return;
  
  setIsRestoringRoute(true);
  
  try {
    // Check if user is still in roughly the same location (within 5km)
    const locationDistance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      storedRoute.userLocation.lat,
      storedRoute.userLocation.lng
    );
    
    // If user has moved too far, don't restore the route
    if (locationDistance > 5) {
      clearPersistedRoute();
      setIsRestoringRoute(false);
      return;
    }
    
    // Recalculate route with current position
    const request: google.maps.DirectionsRequest = {
      origin: { lat: userLocation.lat, lng: userLocation.lng },
      destination: {
        lat: storedRoute.destination.coordinates.lat,
        lng: storedRoute.destination.coordinates.lng,
      },
      travelMode: window.google.maps.TravelMode.DRIVING,
      avoidHighways: false,
      avoidTolls: false,
      provideRouteAlternatives: true,
    };

    directionsService.route(
      request,
      (
      result: google.maps.DirectionsResult | null,
      status: google.maps.DirectionsStatus
      ) => {
      if (status === "OK" && result) {
        // Set the route on the map
        (directionsRenderer as GoogleMapsDirectionsRenderer).setMap(map);
        (directionsRenderer as GoogleMapsDirectionsRenderer).setDirections(result);

        const route = result.routes[0];
        const leg = route.legs[0];

        interface FreshRouteStep {
        instruction: string;
        distance: string;
        duration: string;
        maneuver: string;
        }

        interface FreshRouteData {
        distance: string;
        duration: string;
        steps: FreshRouteStep[];
        polyline: string;
        }

        // Update route data with fresh information
        const freshRouteData: FreshRouteData = {
        distance: leg.distance?.text ?? '',
        duration: leg.duration?.text ?? '',
        steps: leg.steps.map((step: google.maps.DirectionsStep) => ({
          instruction: step.instructions.replace(/<[^>]*>/g, ""),
          distance: step.distance ? step.distance.text : '',
          duration: step.duration ? step.duration.text : '',
          maneuver: (step as any).maneuver || "straight",
        })),
        polyline: route.overview_polyline,
        };

        // Restore UI state
        setRouteData(freshRouteData);
        setShowRouteOptions(true);
        setIsNavigating(true);
        // Find the full PetrolStation object by id
        const matchedStation = petrolStations.find(
          (station) => station.id === storedRoute.destination.id
        );
        setSelectedStation(matchedStation ?? null);

        // Update the persisted data with fresh route info
        saveRouteToStorage(storedRoute.destination, freshRouteData, userLocation);

        // Start position tracking if not already active
        if (!watchPositionId) {
        startPositionTracking(storedRoute.destination);
        }

      } else {
        console.warn('Failed to restore route, removing from storage');
        clearPersistedRoute();
      }
      setIsRestoringRoute(false);
      }
    );
    
  } catch (error) {
    console.error('Error restoring persisted route:', error);
    clearPersistedRoute();
    setIsRestoringRoute(false);
  }
}, [
  map,
  directionsService,
  directionsRenderer,
  userLocation,
  isRestoringRoute,
  loadRouteFromStorage,
  clearPersistedRoute,
  saveRouteToStorage,
  startPositionTracking,
  watchPositionId
]);

useEffect(() => {
  // Only try to restore route after all necessary components are load
  if (
    googleMapsLoaded &&
    isMapLoaded &&
    map &&
    directionsService &&
    directionsRenderer &&
    userLocation &&
    !isRestoringRoute
  ) {
    // Small delay to ensure everything is properly initialized
    const timer = setTimeout(() => {
      restorePersistedRoute();
    }, 5000);
    
    return () => clearTimeout(timer);
  }
}, [
  googleMapsLoaded,
  isMapLoaded,
  map,
  directionsService,
  directionsRenderer,
  userLocation,
  restorePersistedRoute,
  isRestoringRoute
]);

// Effect to handle trip completion with persistence cleanup
useEffect(() => {
  if (destinationReached && currentTrip) {
    // Clear persisted route when destination is reached
    clearPersistedRoute();
  }
}, [destinationReached, currentTrip, clearPersistedRoute]);

// Add loading indicator for route restoration
const RouteRestorationIndicator = () => {
  if (!isRestoringRoute) return null;
  
  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
      <div className={`backdrop-blur-xl rounded-xl shadow-xl border p-4 ${
        darkMode ? 'bg-gray-900/90 border-gray-700/30' : 'bg-white/90 border-white/30'
      }`}>
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Restoring your route...
          </span>
        </div>
      </div>
    </div>
  );
};

// Calculate distance between two coordinates
interface CalculateDistanceFn {
  (lat1: number, lng1: number, lat2: number, lng2: number): number;
}

const calculateDistance: CalculateDistanceFn = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c; // Distance in kilometers
  return d;
};



const handleTripCompletion = async () => {
  if (!currentTrip) return;
  
  try {
    const tripDuration = tripStartTime ? Math.round((new Date().getTime() - tripStartTime.getTime()) / 60000) : null;
    
    const response = await fetch(`${API_BASE_URL}/api/api/trips/${currentTrip.id}/complete_trip/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken, // Use CSRF token
      },
      credentials: 'include', // Use session auth
      body: JSON.stringify({
        actual_distance: Math.round(totalTripDistance * 100) / 100,
        actual_duration: tripDuration
      })
    });
    
    if (response.ok) {
      const completionData = await response.json();
      setTripCompleteData(completionData);
      setShowTripCompleteModal(true);
      
      // Stop navigation
      stopNavigation();
    } else {
      const errorData = await response.text();
      console.error('Failed to complete trip:', response.status, errorData);
    }
  } catch (error) {
    console.error('Failed to complete trip:', error);
  }
};

// Handle trip cancellation
const cancelTrip = async () => {
  if (!currentTrip) return;
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/api/trips/${currentTrip.id}/cancel_trip/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken, // Use CSRF token like other requests
      },
      credentials: 'include', // Use session auth like other requests
      body: JSON.stringify({
        reason: 'user_cancelled'
      })
    });
    
    if (response.ok) {
      setCurrentTrip(null);
      setTripStartTime(null);
      setTotalTripDistance(0);
      setDestinationReached(false);
    } else {
      const errorData = await response.text();
      console.error('Failed to cancel trip:', response.status, errorData);
    }
  } catch (error) {
    console.error('Failed to cancel trip:', error);
  }
};



// Add this new function to handle marker cleanup properly
const cleanupUserLocationMarker = useCallback(() => {
  if (userLocationMarker) {
    userLocationMarker.setMap(null);
    setUserLocationMarker(null);
  }
}, [userLocationMarker]);

// Enhanced stop navigation function
const stopNavigation = useCallback(() => {
  // If there's an active trip that hasn't reached destination, cancel it
  if (currentTrip && !destinationReached) {
    cancelTrip();
  }
  
  if (directionsRenderer) {
    directionsRenderer.setMap(null);
  }
  
  if (watchPositionId) {
    navigator.geolocation.clearWatch(watchPositionId);
    setWatchPositionId(null);
  }
  
  // Clear persisted route data
  clearPersistedRoute();
  
  setIsNavigating(false);
  setRouteData(null);
  setShowRouteOptions(false);
  setCurrentTrip(null);
  setTripStartTime(null);
  setTotalTripDistance(0);
  setDestinationReached(false);
}, [
  directionsRenderer,
  watchPositionId,
  currentTrip,
  destinationReached,
  clearPersistedRoute,
  cancelTrip
]);


const TripCompleteModal = () => {
  if (!showTripCompleteModal || !tripCompleteData) return null;
  
  const handleCloseModal = () => {
    setShowTripCompleteModal(false);
    setTripCompleteData(null);
  };
  
  return (
    <div className="modal modal-open">
      <div className="modal-box relative bg-gradient-to-br from-white to-gray-50 border-0 shadow-2xl max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Trip Complete!</h3>
          <p className="text-gray-600 text-sm">Congratulations on reaching your destination</p>
        </div>
        
        {/* Trip Stats */}
        <div className="space-y-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-600 text-sm font-medium">Distance Traveled</span>
              <span className="text-lg font-bold text-gray-800">
                {tripCompleteData.trip.actual_distance} km
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm font-medium">Duration</span>
              <span className="text-lg font-bold text-gray-800">
                {tripCompleteData.trip.actual_duration} min
              </span>
            </div>
          </div>
          
          {/* Points Earned */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-sm font-bold">★</span>
                </div>
                <span className="text-gray-700 font-semibold">Points Earned</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">
                +{tripCompleteData.points_awarded}
              </span>
            </div>
            
            {tripCompleteData.points_breakdown.reasons.length > 0 && (
              <div className="text-xs text-gray-600">
                {tripCompleteData.points_breakdown.reasons.map((reason, index) => (
                  <div key={index} className="flex items-center mb-1">
                    <div className="w-1 h-1 bg-blue-400 rounded-full mr-2"></div>
                    {reason}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Current Status */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Total Points</span>
              <span className="font-bold text-gray-800">
                {tripCompleteData.user_profile.total_points}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm mt-2">
              <span className="text-gray-600">Loyalty Tier</span>
              <span className="font-bold text-indigo-600 capitalize">
                {tripCompleteData.user_profile.loyalty_tier}
              </span>
            </div>
          </div>
        </div>
        
        {/* Achievements */}
        {tripCompleteData.achievements && tripCompleteData.achievements.length > 0 && (
          <div className="mb-6">
            <h4 className="text-lg font-bold text-gray-800 mb-3 text-center">New Achievements! 🎉</h4>
            {tripCompleteData.achievements.map((achievement, index) => (
              <div key={index} className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-3 mb-2 border border-yellow-200">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{achievement.icon}</span>
                  <div>
                    <div className="font-bold text-gray-800">{achievement.title}</div>
                    <div className="text-sm text-gray-600">{achievement.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Action Button */}
        <div className="modal-action justify-center">
          <button 
            onClick={handleCloseModal}
            className="btn btn-primary bg-gradient-to-r from-blue-500 to-indigo-600 border-0 rounded-full px-8 text-white font-medium hover:from-blue-600 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200"
          >
            Awesome!
          </button>
        </div>
      </div>
    </div>
  );
};

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

interface StationData {
  place_id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

const toggleFavorite = useCallback(async (station: StationData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/favorites/toggle/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      credentials: 'include',
      body: JSON.stringify({
        station_id: station.place_id,
        name: station.name,
        latitude: station.latitude,
        longitude: station.longitude,
        address: station.address || '',
        city: station.city || '',
        state: station.state || '',
        postal_code: station.postal_code || '',
        country: station.country || '',
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setFavorites(prev =>
      data.favorited
        ? [...prev, { google_place_id: station.place_id }]
        : prev.filter(fav => fav.google_place_id !== station.place_id)
    );

    } else {
      console.error('Failed to toggle favorite:', res.statusText);
    }
  } catch (err) {
    console.error('Error toggling favorite:', err);
  }
}, [csrfToken]);


const fetchFavorites = useCallback(async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/favorites/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      credentials: 'include',
    });

    if (res.ok) {
      const data = await res.json();
      setFavorites(data.favorites);
    } else {
      console.error('Failed to fetch favorites:', res.statusText);
    }
  } catch (err) {
    console.error('Error fetching favorites:', err);
  }
}, [csrfToken]);

useEffect(() => {
  if (csrfToken) {
    fetchFavorites();
  }
}, [csrfToken]);

 const toggleSideNav = () => {
    fetchUserProfile();
    setShowSideNav(!showSideNav);// Fetch user profile when side nav is toggled
  };


  const Divider = () => (
    <div className="flex justify-center">
      <div className={`h-px w-3/4 ${darkMode ? 'bg-gray-400' : 'bg-gray-200'}`} />
    </div>
  );

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

const NavigationButton = () => (
  <button
    onClick={() => {
      if (isNavigating) {
        stopNavigation();
      } else if (selectedStation) {
        calculateRoute(selectedStation);
      }
    }}
    disabled={isRestoringRoute}
    className={`flex-1 h-12 rounded-full font-light text-white text-xs px-4 flex items-center justify-center transition-all duration-200 hover:scale-105
      ${isNavigating
        ? 'bg-[#ff593c] hover:bg-[#ff593c]'
        : 'bg-[#2edda2] hover:bg-[#2edda2]'}
      ${isRestoringRoute ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {isNavigating ? (
      <div className="flex items-center">
        {currentTrip && (
          <div className="mr-2 text-xs">
            {Math.round(totalTripDistance * 10) / 10}km
          </div>
        )}
        <span>Stop Navigation</span>
      </div>
    ) : (
      <span>Navigate</span>
    )}
  </button>
);

  // MAPS RELATED - END

  return (
    <div className={`min-h-screen  flex flex-col ${darkMode ? 'dark bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 hidden md:block ${darkMode ? 'bg-black border-gray-700' : 'bg-white border-gray-200'} border-b shadow-sm`}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo and title */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-lg ${darkMode ? 'bg-white' : 'bg-[#2edda2]'} flex items-center justify-center`}>
                <span className={`font-bold text-sm ${darkMode ? 'text-black' : 'text-white'}`}>R</span>
              </div>
              <h1 className="text-xl font-bold bg-[#2edda2] bg-clip-text text-transparent">
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
                className={`p-3 rounded-full ${darkMode ? 'bg-gray-700 text-yellow-300' : 'bg-gray-100 text-gray-700'}`}
              >
                {darkMode ? <Sun className="h-3 w-6" /> : <Moon className="h-3 w-6" />}
              </button>
              
              <div className="relative inline-block">
              <button
                onClick={() => {
                  // Toggle on mobile only
                  if (window.innerWidth < 768) setShowNotifications(prev => !prev);
                }}
                onMouseEnter={() => {
                  if (window.innerWidth >= 768) setShowNotifications(true);
                }}
                onMouseLeave={() => {
                  if (window.innerWidth >= 768) setTimeout(() => setShowNotifications(false), 500);
                }}
                className={`p-3 rounded-full relative ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
              >
                <Bell className="h-3 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full transform translate-x-1/2 -translate-y-1/2 z-50">
                    {notifications.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div
                  className={`absolute right-0 mt-2 w-72 rounded-xl shadow-lg z-50 p-4 ${
                    darkMode ? 'bg-black text-white' : 'bg-gray-100 text-gray-800'
                  }`}
                  onMouseEnter={() => {
                    if (window.innerWidth >= 768) setShowNotifications(true);
                  }}
                  onMouseLeave={() => {
                    if (window.innerWidth >= 768) setShowNotifications(false);
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

              <button className={`hidden md:block p-3 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <Settings className="h-3 w-5" />
              </button>

              <div
                className="relative"
                onMouseEnter={handleUserMouseEnter}
                onMouseLeave={handleUserMouseLeave}
              >
                <div
                  onClick={handleUserClick}
                  className="w-11 h-9 p-3 bg-[#2edda2] rounded-full flex items-center justify-center cursor-pointer select-none"
                  title={user ? `Logged in as ${user.username}` : 'Login'}
                >
                  <svg
                    className="h-3 w-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5.121 17.804A8.967 8.967 0 0112 15a8.967 8.967 0 016.879 2.804M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    ></path>
                  </svg>
                </div>

                {showUserMenu && (
                  <div
                    ref={modalRef}
                    className={`absolute right-0 mt-2 w-48 rounded-xl shadow-lg z-50 p-4 ${
                      darkMode ? 'bg-black text-white' : 'bg-gray-100 text-gray-800'
                    }`}
                    onMouseEnter={() => window.innerWidth >= 768 && setShowUserMenu(true)}
                    onMouseLeave={() => window.innerWidth >= 768 && setShowUserMenu(false)}
                  >
                    {loading ? (
                      <p className="text-sm">Loading user info...</p>
                    ) : error ? (
                      <p className="text-sm text-red-500">{error}</p>
                    ) : user ? (
                      <>
                        <p className="font-semibold">Hello, {user.username}!</p>
                        <p className="text-xs mt-1 text-gray-500">
                          Welcome back to your dashboard.
                        </p>
                        <Link href="/profile" className="text-blue-600 mt-2 block hover:underline">
                          View Profile &rarr;
                        </Link>
                      </>
                    ) : (
                      <p className="text-sm">Not logged in. Click to login.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
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
          </div>
          <div 
            className="bg-black bg-opacity-50 h-full w-full" 
            onClick={() => setIsMenuOpen(false)}
          ></div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-grow flex flex-col md:flex-row">
        {/* Floating Icons */}
        <div className="fixed top-4 left-0 right-0 flex md:hidden items-center justify-between px-4 z-50 pointer-events-none">
          {/* Left side - Hamburger menu */}
          <button
            onClick={toggleSideNav}
            className={`p-2 transition-all duration-200 ${
              darkMode ? 'bg-[#777a69]' : 'bg-white'
            } rounded-full pointer-events-auto ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            {showSideNav ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          {/* Right side - Info */}
          <button
            onClick={() => setShowTutorial(true)}
            className={`p-2 transition-all duration-200 pointer-events-auto ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            <Info size={24} />
          </button>

        </div>
        {showTutorial && <TutorialModal onClose={() => setShowTutorial(false)} />}
        <ShowNearestStationButton onClick={handleShowNearestStationPopup} />
        {showNearestStationPopup && petrolStations.length > 0 && (
          <NearestStationPopup
            station={petrolStations[0]} // Pass the first station from your existing array
            onClose={() => setShowNearestStationPopup(false)}
            onNavigate={calculateRoute} // Pass your calculateRoute method
            autoCloseDelay={5000} // Optional, defaults to 4s
            showCloseButton={true} // Optional, defaults to true
          />
        )} 
        {/* Sidebar with station list */}
        <div className={`w-full md:w-1/3 lg:w-1/4 border-r ${darkMode ? 'border-gray-700' : 'border-gray-200'} overflow-y-auto`}>
          {/* Filters */}
          
          <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex justify-between items-center mb-3 md:ml-0 ml-13 md:mt-0 mt-3 md:pt-0">
              <h2 className="font-semibold hidden md:block">Filters</h2>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-1 text-sm ${darkMode ? 'text-[#2edda2]' : 'text-[#2edda2]'}`}
              >
                <Filter className="h-4 w-4 hidden md:block" />
                <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
                <ChevronDown className={`h-4 w-4 transform ${showFilters ? 'rotate-180' : ''} transition-transform`} />
              </button>
              <input
                type="text"
                placeholder="Search stations or addresses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-50 pl-10 md:hidden pr-4 py-2 rounded-full border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'} focus:outline-none focus:ring-2 focus:ring-[#2edda2] `}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
            
            {/* Fuel type selection */}
            <div className="mb-3">
              <label className="hidden md:block text-sm font-medium mb-2">Fuel Type</label>
              <div className="flex space-x-2">
                {(['regular', 'premium', 'diesel'] as FuelType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFuelType(type)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      fuelType === type 
                        ? 'bg-[#2edda2] text-white' 
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

           {showSideNav && (
              <div className="fixed inset-0 z-40 flex">
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 bg-transparent bg-opacity-40 transition-opacity"
                  onClick={toggleSideNav}
                ></div>

                {/* Side Navigation */}
                <div className={`relative w-90 top-20 h-180 rounded-tr-3xl rounded-br-3xl overflow-hidden ${
                  darkMode ? 'bg-[#3C4142]' : 'bg-white'
                } shadow-2xl transform transition-transform duration-300 ease-in-out`}>

                  {/* User Profile Section */}
                  <div className={`p-5 ${darkMode ? 'bg-[#3C4142]' : 'bg-gray-100'}`}>
                    <div className="flex items-center space-x-3 mb-3 pt-15">
                      <div className="mb-4">
                        {SideUser && SideUser.profile_picture ? (
                          <img
                            src={SideUser.profile_picture}
                            alt="Profile"
                            className="w-24 h-24 rounded-full mx-auto object-cover"
                          />
                        ) : (
                          <ProfileAvatar user={SideUser} />
                        )}
                      </div>
                      <div>
                        <h3 className={`font-semibold text-[16px] ${darkMode ? 'text-white' : 'text-[#3C4142]'}`}>
                          {SideUser ? SideUser.username : "Guest"}
                        </h3>
                        <p className="text-gray-400 text-s font-extralight">Refine Go account</p>
                      </div>
                    </div>
                  </div>
                  <Divider/>

                  {/* Menu List */}
                  <nav className="px-5 py-4 space-y-1 text-[15px]">
                  {/* Dark Mode Toggle */}
                  <div
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition ${
                      darkMode ? 'hover:bg-gray-700 text-gray-100' : 'hover:bg-gray-100 text-gray-800'
                    }`}
                  >
                    <span className="flex items-center space-x-3">

                      <span className='text-[16px]'></span>
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={darkMode}
                        onChange={toggleDarkMode}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[#2edda2] peer-focus:outline-none rounded-full peer dark:bg-gray-200 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-[#777a69]"></div>
                    </label>
                  </div>

                  {/* Menu List */}
                  {navItems.map(({ icon, label, badge, onClick }, index) => (
                    <div key={label}>
                      <button
                        onClick={onClick}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition ${
                          darkMode ? 'hover:bg-gray-700 text-gray-100' : 'hover:bg-gray-100 text-gray-800'
                        }`}
                      >
                        <span className="flex items-center space-x-3">
                          {icon}
                          <span>{label}</span>
                        </span>
                      </button>
                      <div className={`${darkMode ? 'bg-gray-400' : 'bg-gray-200'} h-[1px] w-full my-1`} />
                    </div>
                  ))}
                </nav>
                </div>
              </div>
            )}
          
          {activeModal === 'safety' && (
            <BaseModal showModal={true} onClose={closeModal}>
              <SafetyModal onClose={closeModal} />
            </BaseModal>
          )}

          {activeModal === 'support' && (
            <BaseModal showModal={true} onClose={closeModal}>
              <SupportModal onClose={closeModal} />
            </BaseModal>
          )}

          {activeModal === 'about' && (
            <BaseModal showModal={true} onClose={closeModal}>
              <AboutModal onClose={closeModal} />
            </BaseModal>
          )}


          {/* Station list */}
          <div className="max-h-[350px] md:max-h-[500px] overflow-y-auto scrollbar-hide divide-y divide-gray-200">
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
                  <div className="flex h-16 md:h-max justify-between items-start">
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
          <div className={`h-full w-full ${darkMode ? 'bg-gray-900' : 'bg-gray-200'} flex items-center justify-center`}>
            {/* Map placeholder */}
            <div className="text-center p-8">
              <div className="flex-grow relative">
              {/* Premium loading experience with dual mode support */}
              {isLoading && (
                <div className={`fixed inset-0 z-50 flex items-center justify-center ${darkMode ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-white via-gray-50 to-white'}`}>
                  <div className="relative">
                    
                    {/* Dynamic morphing loader */}
                    <div className="relative flex items-center justify-center mb-8">
                      <div className="absolute inset-0">
                        <div 
                          className="w-24 h-24 rounded-full"
                          style={{
                            background: `conic-gradient(from 0deg, transparent, ${darkMode ? '#2edda2' : '#30d5c8'}, transparent)`,
                            animation: 'rotate 2s linear infinite'
                          }}
                        ></div>
                        <div 
                          className={`absolute inset-2 w-20 h-20 rounded-full ${darkMode ? 'bg-slate-900' : 'bg-white'}`}
                          style={{
                            boxShadow: `inset 0 0 20px ${darkMode ? 'rgba(46, 221, 162, 0.3)' : 'rgba(48, 213, 200, 0.3)'}`
                          }}
                        ></div>
                      </div>
                      
                      {/* Expanding rings */}
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className={`absolute w-16 h-16 rounded-full border ${darkMode ? 'border-[#2edda2]/20' : 'border-[#30d5c8]/20'}`}
                          style={{
                            animation: `expand 3s ease-out infinite ${i * 0.8}s`
                          }}
                        ></div>
                      ))}
                      
                      {/* Central pulse */}
                      <div 
                        className={`w-8 h-8 rounded-full ${darkMode ? 'bg-gradient-to-r from-[#2edda2] to-emerald-400 shadow-[#2edda2]/50' : 'bg-gradient-to-r from-[#30d5c8] to-teal-400 shadow-[#30d5c8]/50'} shadow-lg`}
                        style={{
                          animation: 'heartbeat 1.5s ease-in-out infinite'
                        }}
                      ></div>
                    </div>
                    
                    {/* Progressive text reveal */}
                    <div className="text-center space-y-4">
                      <div className="overflow-hidden">
                        <h2 
                          className={`text-2xl font-light tracking-wider ${darkMode ? 'text-white' : 'text-gray-800'}`}
                          style={{
                            animation: 'slideUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.3s both'
                          }}
                        >
                          Crafting Excellence
                        </h2>
                      </div>
                      
                      <div className="overflow-hidden">
                        <p 
                          className={`text-sm font-medium tracking-wide ${darkMode ? 'text-white/70' : 'text-gray-600'}`}
                          style={{
                            animation: 'slideUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.6s both'
                          }}
                        >
                          Preparing your experience
                        </p>
                      </div>
                      
                      {/* Dynamic progress indicator */}
                      <div 
                        className={`mt-6 w-48 h-0.5 rounded-full overflow-hidden mx-auto ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`}
                        style={{
                          animation: 'fadeIn 0.8s ease-out 0.9s both'
                        }}
                      >
                        <div 
                          className={`h-full rounded-full ${darkMode ? 'bg-gradient-to-r from-[#2edda2] via-emerald-400 to-[#2edda2]' : 'bg-gradient-to-r from-[#30d5c8] via-teal-400 to-[#30d5c8]'}`}
                          style={{
                            width: '100%',
                            animation: 'shimmer 2s ease-in-out infinite'
                          }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Ambient glow */}
                    <div 
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: `radial-gradient(circle at center, ${darkMode ? 'rgba(46, 221, 162, 0.1)' : 'rgba(48, 213, 200, 0.1)'} 0%, transparent 70%)`,
                        animation: 'breathe 4s ease-in-out infinite'
                      }}
                    ></div>
                  </div>
                  
                  <style jsx>{`
                    @keyframes rotate {
                      0% { transform: rotate(0deg); }
                      100% { transform: rotate(360deg); }
                    }
                    
                    @keyframes expand {
                      0% { 
                        transform: scale(0.8); 
                        opacity: 0.8; 
                      }
                      100% { 
                        transform: scale(2.5); 
                        opacity: 0; 
                      }
                    }
                    
                    @keyframes heartbeat {
                      0%, 100% { 
                        transform: scale(1); 
                        filter: brightness(1);
                      }
                      50% { 
                        transform: scale(1.1); 
                        filter: brightness(1.2);
                      }
                    }
                    
                    @keyframes slideUp {
                      0% { 
                        transform: translateY(30px); 
                        opacity: 0; 
                      }
                      100% { 
                        transform: translateY(0); 
                        opacity: 1; 
                      }
                    }
                    
                    @keyframes shimmer {
                      0% { transform: translateX(-100%); }
                      100% { transform: translateX(100%); }
                    }
                    
                    @keyframes breathe {
                      0%, 100% { opacity: 0.6; transform: scale(1); }
                      50% { opacity: 1; transform: scale(1.05); }
                    }
                    
                    @keyframes fadeIn {
                      0% { opacity: 0; }
                      100% { opacity: 1; }
                    }
                  `}</style>
                </div>
              )}
              {/* Google Map Container */}
              <div 
                ref={mapRef} 
                className="w-full h-full rounded-2xl mb-2 overflow-hidden shadow-lg min-h-[450px] md:min-h-[400px]"
              />

              {/* Map Controls */}
              <div className="absolute -top-5 -left-5 z-10 space-y-2">
                <CustomMapControls />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-lg mx-auto">
                {visibleStations.map((station) => (
                  <div key={station.id} className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'} shadow`}>
                    <div className={`h-2 ${getBusyLevelColorBelow(station.busyLevel)} rounded-full mb-2`}></div>
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
              className={`
                p-4 z-40 shadow-lg rounded-t-xl border-t 
                overflow-y-auto scrollbar-hide transition-transform duration-300
                max-h-[70vh] h-73 md:h-80
                ${darkMode ? 'bg-black border-gray-700' : 'bg-white border-gray-200'}
                
                fixed left-0 right-0 bottom-16
                md:absolute md:inset-0 md:top-auto md:bottom-0
              `}
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
                
                <NavigationButton/>

                  {(() => {
                  const isFavorite = favorites.some(
                    fav => fav.google_place_id === selectedStation.id
                  );

                  return (
                    <button
                      onClick={() => toggleFavorite({
                        place_id: selectedStation.id,
                        name: selectedStation.name,
                        latitude: selectedStation.coordinates.lat,
                        longitude: selectedStation.coordinates.lng,
                        address: selectedStation.address,
                      })}
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
                      ${showTraffic ? 'bg-[#ff593c]' : 'bg-[#30d5c8]'} text-white shadow-md dark:text-white`}
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
                        ? 'bg-[#30d5c8] text-white' 
                        : 'bg-[#30d5c8] text-white'}`}
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
                  
                  <div className="space-y-4 max-h-80 overflow-y-auto scrollbar-hide ">
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
                        <button className="text-[11px] text-[#2edda2] hover:text-[#2edda2]font-medium">
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
      <div className="absolute hidden md:block bottom-4 right-4 z-10">
      <div className="relative">
        {/* Toggle Button */}
        <button
          onClick={() => setOpen(prev => !prev)}
          className="h-10 w-10 rounded-full bg-[#2edda2] text-white shadow-lg flex items-center justify-center hover:bg-[#2edda2] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4" />
        </button>

        {/* Floating Actions */}
        {open && (
          <div className="absolute bottom-16 right-0 flex flex-col-reverse items-end space-y-reverse space-y-2">
            {actions.map(({ icon, label, onClick }, index) => (
              <button
                key={index}
                onClick={() => {
                  onClick()
                  setOpen(false) // close after click (optional)
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition
                  ${darkMode ? 'bg-[#2edda2] bg-opacity-20 text-gray-100 hover:bg-gray-700' : 'bg-[#2edda2] text-white'}
                `}
              >
                <span className="flex items-center space-x-3">
                  {icon}
                  <span className="text-xs">{label}</span>
                </span>
              </button>
            ))}
          </div>
        )}
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
      <div className="fixed bottom-0 left-0 w-full z-50">
        <BottomNav darkMode={darkMode} user={user}/>
      </div>


      {/* Trip Complete Modal */}
      <TripCompleteModal />
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
