import React, { useState, useEffect } from 'react';
import { CheckCircle, Award, Star, TrendingUp, MapPin, Clock, Route } from 'lucide-react';

interface TripCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripData: {
    trip: {
      actual_distance?: number;
      planned_distance?: number;
      actual_duration?: number;
      planned_duration?: number;
      start_address: string;
      destination_address: string;
    };
    points_awarded: number;
    points_breakdown: {
      base_points: number;
      bonus_points: number;
      reasons?: string[];
    };
    user_profile: {
      loyalty_tier: string;
      discount_percentage: number;
      total_points: number;
      next_tier_points?: number;
      lifetime_points: number;
    };
    achievements?: {
      icon: string;
      title: string;
      description: string;
    }[];
  };
  onViewStats: () => void;
}

const TripCompletionModal: React.FC<TripCompletionModalProps> = ({ 
  isOpen, 
  onClose, 
  tripData,
  onViewStats 
}) => {
  const [showCelebration, setShowCelebration] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setShowCelebration(true);
      // Animate through steps
      const timer = setTimeout(() => setCurrentStep(1), 500);
      const timer2 = setTimeout(() => setCurrentStep(2), 1000);
      return () => {
        clearTimeout(timer);
        clearTimeout(timer2);
      };
    }
  }, [isOpen]);

  if (!isOpen || !tripData) return null;

  const { trip, points_awarded, points_breakdown, user_profile, achievements } = tripData;
  const totalPoints = points_breakdown.base_points + points_breakdown.bonus_points;

interface TierColors {
    [key: string]: string;
    bronze: string;
    silver: string;
    gold: string;
    platinum: string;
    diamond: string;
}

const getTierColor = (tier: string): string => {
    const colors: TierColors = {
        bronze: 'text-amber-600',
        silver: 'text-gray-500',
        gold: 'text-yellow-500',
        platinum: 'text-purple-500',
        diamond: 'text-blue-500'
    };
    return colors[tier] || 'text-gray-500';
};

interface TierIcons {
    [key: string]: string;
    bronze: string;
    silver: string;
    gold: string;
    platinum: string;
    diamond: string;
}

const getTierIcon = (tier: string): string => {
    const icons: TierIcons = {
        bronze: '🥉',
        silver: '🥈', 
        gold: '🥇',
        platinum: '💎',
        diamond: '💠'
    };
    return icons[tier] || '⭐';
};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-white rounded-3xl shadow-2xl transform transition-all duration-500 scale-100">
        {/* Celebration Animation Overlay */}
        {showCelebration && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
            <div className="absolute -top-2 -left-2 w-4 h-4 bg-yellow-400 rounded-full animate-ping" />
            <div className="absolute top-4 right-8 w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            <div className="absolute bottom-8 left-6 w-3 h-3 bg-green-400 rounded-full animate-bounce" />
            <div className="absolute top-12 left-12 w-2 h-2 bg-purple-400 rounded-full animate-ping" />
            <div className="absolute bottom-12 right-4 w-3 h-3 bg-pink-400 rounded-full animate-pulse" />
          </div>
        )}

        {/* Content */}
        <div className="p-8 text-center">
          {/* Success Icon */}
          <div className={`mb-6 transform transition-all duration-700 ${currentStep >= 0 ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Trip Completed!</h2>
            <p className="text-gray-600">
              Great job reaching your destination
            </p>
          </div>

          {/* Trip Summary */}
          <div className={`mb-6 transform transition-all duration-700 delay-300 ${currentStep >= 1 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-gray-600">
                  <Route className="w-4 h-4 mr-2" />
                  Distance
                </div>
                <span className="font-semibold text-gray-900">
                  {trip.actual_distance || trip.planned_distance} km
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  Duration
                </div>
                <span className="font-semibold text-gray-900">
                  {Math.round((((trip.actual_duration ?? trip.planned_duration) ?? 0) / 60) * 10) / 10} hours
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  Route
                </div>
                <span className="font-semibold text-gray-900 text-right text-xs">
                  {trip.start_address.split(',')[0]} → {trip.destination_address.split(',')[0]}
                </span>
              </div>
            </div>
          </div>

          {/* Points Earned */}
          <div className={`mb-6 transform transition-all duration-700 delay-500 ${currentStep >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <Award className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
                +{totalPoints} Points
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Base Points</span>
                  <span className="font-semibold text-gray-900">+{points_breakdown.base_points}</span>
                </div>
                
                {points_breakdown.bonus_points > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Bonus Points</span>
                    <span className="font-semibold text-purple-600">+{points_breakdown.bonus_points}</span>
                  </div>
                )}
              </div>

              {/* Bonus Reasons */}
              {points_breakdown.reasons && points_breakdown.reasons.length > 0 && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <p className="text-xs text-gray-600 mb-2">Bonus earned for:</p>
                  <div className="space-y-1">
                    {points_breakdown.reasons.slice(0, 3).map((reason, index) => (
                      <div key={index} className="text-xs text-purple-600 bg-purple-50 rounded-lg px-3 py-1">
                        {reason}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* User Profile Status */}
          <div className="mb-6">
            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <span className="text-lg mr-2">{getTierIcon(user_profile.loyalty_tier)}</span>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900 capitalize">
                      {user_profile.loyalty_tier} Member
                    </p>
                    <p className="text-xs text-gray-600">
                      {user_profile.discount_percentage}% fuel discount
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {user_profile.total_points.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-600">total points</p>
                </div>
              </div>

              {/* Progress to next tier */}
              {user_profile.next_tier_points && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Next tier</span>
                    <span>{user_profile.next_tier_points} points to go</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000"
                      style={{ 
                        width: `${Math.max(10, Math.min(90, 
                          ((user_profile.lifetime_points % 5000) / 5000) * 100
                        ))}%` 
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Achievements */}
          {achievements && achievements.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">🎉 New Achievements!</h4>
              <div className="space-y-2">
                {achievements.map((achievement, index) => (
                  <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{achievement.icon}</span>
                      <div className="text-left">
                        <p className="font-semibold text-yellow-900 text-sm">
                          {achievement.title}
                        </p>
                        <p className="text-yellow-700 text-xs">
                          {achievement.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={onViewStats}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold py-4 px-6 rounded-2xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              View My Stats
            </button>
            
            <button
              onClick={onClose}
              className="w-full bg-gray-100 text-gray-700 font-semibold py-4 px-6 rounded-2xl hover:bg-gray-200 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Continue Exploring
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripCompletionModal;