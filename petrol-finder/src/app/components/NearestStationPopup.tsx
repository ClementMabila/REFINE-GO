import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, X } from 'lucide-react';

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

type NearestStationPopupProps = {
  station: PetrolStation | null;
  onClose?: () => void;
  onNavigate?: (station: PetrolStation) => void;
  autoCloseDelay?: number;
  showCloseButton?: boolean;
};

const NearestStationPopup = ({
  station,
  onClose,
  onNavigate,
  autoCloseDelay = 4000,
  showCloseButton = true,
}: NearestStationPopupProps) => {
  const [showModal, setShowModal] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  // Handle modal visibility and auto-close
  useEffect(() => {
    if (showModal) {
      setTimeout(() => setIsVisible(true), 100);

      const autoCloseTimer = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);

      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - 100 / (autoCloseDelay / 100);
          return newProgress <= 0 ? 0 : newProgress;
        });
      }, 100);

      return () => {
        clearTimeout(autoCloseTimer);
        clearInterval(progressInterval);
      };
    }
  }, [showModal, autoCloseDelay]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      setShowModal(false);
      if (onClose) onClose();
    }, 300);
  };

  const handleStationClick = () => {
    if (station && onNavigate) {
      onNavigate(station);
    }
    handleClose();
  };

  if (!showModal || !station) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
      <div
        className={`relative bg-white/95 dark:bg-gray-900/95 w-full max-w-sm rounded-3xl shadow-2xl border border-gray-200/20 dark:border-gray-700/30 transform transition-all duration-300 ease-out ${
          isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`}
      >
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200/50 dark:bg-gray-700/50 rounded-t-3xl overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#2edda2] to-[#1fb380] transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header */}
        <div className="relative overflow-hidden rounded-t-3xl pt-3">
          <div className="absolute inset-0 bg-gradient-to-br from-[#2edda2]/10 via-[#2edda2]/5 to-transparent"></div>
          <div className="relative p-4 pb-2">
            {showCloseButton && (
              <button
                onClick={handleClose}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-gray-100/80 dark:bg-gray-800/80 flex items-center justify-center hover:bg-gray-200/80 dark:hover:bg-gray-700/80 transition-all duration-200 group"
              >
                <X className="w-3 h-3 text-gray-600 dark:text-gray-400 group-hover:scale-110 transition-transform duration-200" />
              </button>
            )}

            {/* Animated icon */}
            <div className="mb-3">
              <div className="relative w-12 h-12 mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-[#2edda2] to-[#1fb380] rounded-xl shadow-lg shadow-[#2edda2]/25"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-[#2edda2] to-[#1fb380] rounded-xl animate-pulse opacity-75"></div>
                <div className="relative w-full h-full flex items-center justify-center">
                  <Navigation className="w-5 h-5 text-white drop-shadow-sm" />
                </div>
                <div className="absolute inset-0 rounded-xl bg-[#2edda2]/30 animate-ping"></div>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-center bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Nearest Station
            </h3>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 pb-5">
          <div onClick={handleStationClick} className="cursor-pointer group">
            <div className="bg-gray-50/80 dark:bg-gray-800/50 rounded-2xl p-4 mb-3 group-hover:bg-gray-100/80 dark:group-hover:bg-gray-700/50 transition-all duration-200">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-base">{station.name}</h4>
                  <div className="flex items-center mt-1 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="w-3 h-3 mr-1" />
                    <span className="truncate">{station.address}</span>
                  </div>
                </div>
                <div className="text-right ml-3">
                  <div className="text-lg font-bold text-[#2edda2]">
                    {station.regularPrice ? `R${station.regularPrice.toFixed(2)}` : 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500">per litre</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center text-gray-600 dark:text-gray-400">
                    <Navigation className="w-3 h-3 mr-1" />
                    {station.distance.toFixed(1)} km
                  </span>
                  <span className="flex items-center text-gray-600 dark:text-gray-400">
                    <Clock className="w-3 h-3 mr-1" />
                    {station.isOpen ? 'Open now' : 'Closed'}
                  </span>
                </div>
                <div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                      station.busyLevel === 'high'
                        ? 'bg-red-200 text-red-800'
                        : station.busyLevel === 'medium'
                        ? 'bg-yellow-200 text-yellow-800'
                        : 'bg-green-200 text-green-800'
                    }`}
                  >
                    {station.busyLevel || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Navigation hint */}
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-2">
                Tap to navigate
              </div>
              <div className="flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-[#2edda2]/20 flex items-center justify-center">
                  <Navigation className="w-3 h-3 text-[#2edda2]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NearestStationPopup;