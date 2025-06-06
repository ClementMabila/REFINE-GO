import React, { useState, useEffect } from 'react';
import { X, MapPin, Clock, CheckCircle2 } from 'lucide-react';

const TripsModal = () => {
  const [showModal, setShowModal] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (showModal) {
      setTimeout(() => setIsVisible(true), 50);
    }
  }, [showModal]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => setShowModal(false), 300);
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div 
        className={`relative bg-white/95 backdrop-blur-xl dark:bg-gray-900/95 w-full max-w-sm rounded-3xl shadow-2xl border border-gray-200/20 dark:border-gray-700/30 transform transition-all duration-300 ease-out ${
          isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`}
      >
        {/* Header with animated gradient */}
        <div className="relative overflow-hidden rounded-t-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-[#2edda2]/10 via-[#2edda2]/5 to-transparent"></div>
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
                <div className="absolute inset-0 bg-gradient-to-br from-[#2edda2] to-[#1fb380] rounded-2xl shadow-lg shadow-[#2edda2]/25"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-[#2edda2] to-[#1fb380] rounded-2xl animate-pulse opacity-75"></div>
                <div className="relative w-full h-full flex items-center justify-center">
                  <MapPin className="w-7 h-7 text-white drop-shadow-sm" />
                </div>
                {/* Floating animation dots */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#2edda2] rounded-full animate-bounce delay-100"></div>
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-[#2edda2]/60 rounded-full animate-bounce delay-300"></div>
              </div>
            </div>
            
            <h2 className="text-xl font-semibold text-center bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              About Trips
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-2">
          <p className="text-center text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
            Track all your fuel station visits in one place. Monitor completed trips and manage pending visits with ease.
          </p>
          
          {/* Feature highlights */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/50 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-[#2edda2]/20 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-[#2edda2]" />
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300">View completed visits</span>
            </div>
            
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/50 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-[#2edda2]/20 flex items-center justify-center">
                <Clock className="w-4 h-4 text-[#2edda2]" />
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Track pending trips</span>
            </div>
          </div>
        </div>

        {/* Bottom action */}
        <div className="p-6 pt-0">
          <button
            onClick={handleClose}
            className="w-full py-3.5 bg-gradient-to-r from-[#2edda2] to-[#1fb380] text-white font-medium rounded-2xl shadow-lg shadow-[#2edda2]/25 hover:shadow-xl hover:shadow-[#2edda2]/30 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            Got it
          </button>
        </div>

        {/* Subtle glow effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#2edda2]/20 via-transparent to-[#2edda2]/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl"></div>
      </div>
    </div>
  );
};

export default TripsModal;