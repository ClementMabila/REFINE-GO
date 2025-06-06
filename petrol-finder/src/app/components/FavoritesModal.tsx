import React, { useState, useEffect, useCallback } from 'react';
import { X, Heart, MapPin, Star, Loader2 } from 'lucide-react';

interface FavoritesModalProps {
  showModal: boolean;
  onClose: () => void;
}

interface Station {
  name?: string;
  address?: string;
  brand?: string;
  rating?: number;
  // Add other fields as needed
}

const FavoritesModal: React.FC<FavoritesModalProps> = ({ showModal, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [favorites, setFavorites] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [csrfToken, setCsrfToken] = useState("");
  
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  
  interface TruncateFn {
    (text: string, limit?: number): string;
  }

  const truncate: TruncateFn = (text, limit = 30) =>
     text.length > limit ? `${text.slice(0, limit).trim()}…` : text;

  // Fetch CSRF token
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
  }, [API_BASE_URL]);

  // Fetch favorites
  const fetchFavorites = useCallback(async () => {
    if (!csrfToken) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/user_favorites/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        console.log('Fetched favorites:', data);
        setFavorites(data|| []);
      } else {
        console.error('Failed to fetch favorites:', res.statusText);
        setFavorites([]);
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, [csrfToken, API_BASE_URL]);

  useEffect(() => {
    if (showModal) {
      setTimeout(() => setIsVisible(true), 50);
      fetchFavorites();
    }
  }, [showModal, fetchFavorites]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div 
        className={`relative bg-white/95 backdrop-blur-xl dark:bg-gray-900/95 w-full max-w-md rounded-3xl shadow-2xl border border-pink-200/30 dark:border-purple-700/30 transform transition-all duration-300 ease-out ${
          isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`}
      >
        {/* Header with animated gradient */}
        <div className="relative overflow-hidden rounded-t-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-transparent"></div>
          <div className="relative p-6 pb-4">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm flex items-center justify-center hover:bg-gray-200/80 dark:hover:bg-gray-700/80 transition-all duration-200 group"
            >
              <X className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:scale-110 transition-transform duration-200" />
            </button>
            
            {/* Animated icon container */}
            <div className="mb-4">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl shadow-lg shadow-pink-500/25"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl animate-pulse opacity-75"></div>
                <div className="relative w-full h-full flex items-center justify-center">
                  <Heart className="w-7 h-7 text-white drop-shadow-sm fill-current" />
                </div>
                {/* Floating animation dots */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-400 rounded-full animate-bounce delay-100"></div>
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-purple-400/60 rounded-full animate-bounce delay-300"></div>
              </div>
            </div>
            
            <h2 className="text-xl font-semibold text-center bg-gradient-to-r from-pink-600 to-purple-600 dark:from-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
              Your Favorite Stations
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-2 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-pink-500 animate-spin mb-3" />
              <p className="text-gray-600 dark:text-gray-400">Loading your favorites...</p>
            </div>
          ) : favorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Heart className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-600 dark:text-gray-400 text-center">
                No favorite stations yet
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 text-center mt-1">
                Start adding stations to your favorites
              </p>
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              {favorites.map((station, index) => (
                <div key={index} className="p-4 rounded-xl bg-gradient-to-r from-pink-50/80 to-purple-50/80 dark:from-pink-900/20 dark:to-purple-900/20 backdrop-blur-sm border border-pink-200/30 dark:border-purple-700/30">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3
                        className="font-medium text-gray-900 dark:text-white mb-1 truncate w-[90%] sm:w-auto"
                        title={station.name}
                      >
                        {truncate(station.name || 'Station Name')}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 truncate dark:text-gray-400 mb-2">
                        <MapPin className="w-4 h-4 mr-1 text-pink-500" />
                        <span className="truncate">
                          {truncate(station.address ||'Address not available')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center ml-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center">
                        <Heart className="w-4 h-4 text-white fill-current" />
                      </div>
                    </div>
                  </div>
                  
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom action */}
        <div className="p-6 pt-0">
          <button
            onClick={handleClose}
            className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-2xl shadow-lg shadow-pink-500/25 hover:shadow-xl hover:shadow-pink-500/30 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            Close
          </button>
        </div>

        {/* Subtle glow effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500/20 via-transparent to-purple-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl"></div>
      </div>
    </div>
  );
};

export default FavoritesModal;