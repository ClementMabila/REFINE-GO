"use client";

import React, { useState, useEffect } from 'react';
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
  RefreshCw
} from 'lucide-react';

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
  const [notifications, setNotifications] = useState(3);
  
  // API related state
  const [petrolStations, setPetrolStations] = useState<PetrolStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Get user's current location
  const getUserLocation = (): Promise<UserLocation> => {
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
  };

  // Fetch petrol stations from API
  const fetchPetrolStations = async (location: UserLocation, radius: number = 5) => {
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
  };

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
  }, []);

  // Refresh data
  const handleRefresh = async () => {
    if (userLocation) {
      await fetchPetrolStations(userLocation);
    }
  };
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  // Filter stations based on search and filters
  const filteredStations = petrolStations.filter(station => {
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

  // Helper function for busy level indicator
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
  const getPrice = (station: PetrolStation): number => {
    switch (fuelType) {
      case 'regular': return station.regularPrice;
      case 'premium': return station.premiumPrice;
      case 'diesel': return station.dieselPrice;
      default: return station.regularPrice;
    }
  };

  // Format reliability score
  const formatReliabilityScore = (score: number): string => {
    return `${Math.round(score * 100)}% reliable`;
  };

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
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
              
              <button className={`relative p-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <Bell className="h-3 w-5" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notifications}
                  </span>
                )}
              </button>
              
              <button className={`hidden md:block p-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <Settings className="h-3 w-5" />
              </button>
              
              <div className="w-11 h-7 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <User className="h-3 w-3 text-white" />
              </div>
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
          <div className="divide-y divide-gray-200">
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
        
        {/* Map area */}
        <div className="flex-grow relative">
          {/* Placeholder for map - in a real app, this would be a mapping component */}
          <div className={`h-full w-full ${darkMode ? 'bg-gray-800' : 'bg-gray-200'} flex items-center justify-center`}>
            {/* Map placeholder */}
            <div className="text-center p-8">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-blue-500" />
              <h3 className="text-xl font-semibold mb-2">Interactive Map</h3>
              <p className={`mb-4 max-w-md ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                In a real implementation, this would be an interactive map showing petrol stations with custom markers.
              </p>
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
          
          {/* Selected station details - appears when station is selected */}
          {selectedStation && (
            <div className={`absolute bottom-0 left-0 right-0 p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg rounded-t-xl border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
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
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button className="btn btn-primary bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg flex items-center justify-center">
                  <Navigation className="h-5 w-5 mr-2" />
                  Navigate
                </button>
                <button className="btn border border-blue-500 text-blue-500 py-2 px-4 rounded-lg flex items-center justify-center">
                  <Heart className="h-5 w-5 mr-2" />
                  Save as Favorite
                </button>
              </div>
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