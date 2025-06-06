import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  MapPin, 
  Navigation, 
  Heart, 
  Eye, 
  StopCircle, 
  Star, 
  Zap, 
  ChevronRight, 
  ChevronLeft,
  Fuel,
  Route,
  Clock,
  Plus,
  Search,
  Filter
} from 'lucide-react';

interface TutorialModalProps {
  onClose: () => void;
}

const TutorialModal: React.FC<TutorialModalProps> = ({ onClose }) => {
  const [showModal, setShowModal] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Touch/swipe handling
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const tutorialSteps = [
    {
      id: 'welcome',
      title: 'Welcome to Refine Go',
      subtitle: 'Your ultimate fuel station companion',
      icon: Fuel,
      color: 'from-[#00d47e] to-[#00b869]',
      description: 'Discover nearby stations, track visits, and never run out of fuel again. Let\'s take a quick tour!',
      features: [
        { icon: MapPin, text: 'Find nearby stations instantly' },
        { icon: Route, text: 'Smart navigation & routing' },
        { icon: Clock, text: 'Track your fuel history' }
      ]
    },
    {
      id: 'select-station',
      title: 'Select Your Station',
      subtitle: 'Choose from thousands of locations',
      icon: MapPin,
      color: 'from-[#00d47e] to-[#20e88a]',
      description: 'Tap on any fuel station marker on the map to see details, prices, and amenities.',
      features: [
        { icon: Search, text: 'Search by name or location' },
        { icon: Filter, text: 'Filter by fuel type & brand' },
        { icon: Star, text: 'See ratings & reviews' }
      ]
    },
    {
      id: 'navigation',
      title: 'Navigate with Ease',
      subtitle: 'Get there faster, every time',
      icon: Navigation,
      color: 'from-[#00d47e] to-[#00c474]',
      description: 'Press the navigation button to get turn-by-turn directions to your selected station.',
      features: [
        { icon: Route, text: 'Real-time traffic updates' },
        { icon: Zap, text: 'Fastest route optimization' },
        { icon: Clock, text: 'Accurate arrival times' }
      ]
    },
    {
      id: 'trips',
      title: 'Visit & Track Trips',
      subtitle: 'Monitor your fuel journey',
      icon: Eye,
      color: 'from-[#00d47e] to-[#1fb380]',
      description: 'View all your completed visits and manage ongoing trips in one convenient place.',
      features: [
        { icon: Clock, text: 'Trip history & analytics' },
        { icon: MapPin, text: 'Visit timestamps & locations' },
        { icon: Fuel, text: 'Fuel consumption tracking' }
      ]
    },
    {
      id: 'stop-trip',
      title: 'Stop Trip Control',
      subtitle: 'Full control over your journey',
      icon: StopCircle,
      color: 'from-[#ff6b6b] to-[#ee5a52]',
      description: 'Need to cancel or modify your trip? Use the stop trip feature for instant control.',
      features: [
        { icon: StopCircle, text: 'Cancel trips instantly' },
        { icon: Route, text: 'Modify route on-the-go' },
        { icon: Clock, text: 'Pause & resume functionality' }
      ]
    },
    {
      id: 'favorites',
      title: 'Favorites & More',
      subtitle: 'Personalize your experience',
      icon: Heart,
      color: 'from-[#ff6b9d] to-[#c44569]',
      description: 'Save your favorite stations, discover nearby amenities, and unlock premium features.',
      features: [
        { icon: Heart, text: 'Save favorite stations' },
        { icon: Plus, text: 'Add new station locations' },
        { icon: Star, text: 'Rate & review stations' }
      ]
    }
  ];

  useEffect(() => {
    if (showModal) {
      setTimeout(() => setIsVisible(true), 50);
    }
  }, [showModal]);

  // Swipe detection
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentStep < tutorialSteps.length - 1) {
      nextStep();
    }
    if (isRightSwipe && currentStep > 0) {
      prevStep();
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      setShowModal(false);
      onClose();
    }, 300);
  };

  const nextStep = () => {
    console.log('Next step clicked', { currentStep, isAnimating, maxSteps: tutorialSteps.length - 1 });
    
    if (currentStep < tutorialSteps.length - 1 && !isAnimating) {
      setIsAnimating(true);
      setCurrentStep(prev => {
        const newStep = prev + 1;
        console.log('Moving to step:', newStep);
        return newStep;
      });
      
      setTimeout(() => {
        setIsAnimating(false);
      }, 500);
    }
  };

  const prevStep = () => {
    console.log('Previous step clicked', { currentStep, isAnimating });
    
    if (currentStep > 0 && !isAnimating) {
      setIsAnimating(true);
      setCurrentStep(prev => {
        const newStep = prev - 1;
        console.log('Moving to step:', newStep);
        return newStep;
      });
      
      setTimeout(() => {
        setIsAnimating(false);
      }, 500);
    }
  };

  interface Feature {
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    text: string;
  }

  interface TutorialStep {
    id: string;
    title: string;
    subtitle: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    color: string;
    description: string;
    features: Feature[];
  }

  const goToStep = (index: number) => {
    console.log('Go to step clicked', { index, currentStep, isAnimating });
    
    if (index !== currentStep && !isAnimating) {
      setIsAnimating(true);
      setCurrentStep(index);
      
      setTimeout(() => {
        setIsAnimating(false);
      }, 500);
    }
  };

  if (!showModal) return null;

  const current = tutorialSteps[currentStep];
  const IconComponent = current.icon;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div 
        ref={modalRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className={`relative bg-white/98 backdrop-blur-2xl w-full max-w-md rounded-3xl shadow-2xl border border-white/20 transform transition-all duration-500 ease-out ${
          isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-8'
        }`}
      >
        {/* Swipe indicator */}
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gray-300 rounded-full opacity-50"></div>
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 text-center">
          Swipe to navigate
        </div>

        {/* Animated background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${current.color} opacity-5 rounded-3xl transition-all duration-700`}></div>
        
        {/* Floating orbs */}
        <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-[#00d47e]/20 to-transparent rounded-full blur-xl animate-pulse"></div>
        <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br from-[#00d47e]/15 to-transparent rounded-full blur-lg animate-pulse delay-1000"></div>

        {/* Header */}
        <div className="relative p-6 pb-4 pt-8">
          <button
            onClick={handleClose}
            className="absolute top-6 right-4 w-10 h-10 rounded-full bg-gray-100/80 backdrop-blur-sm flex items-center justify-center hover:bg-gray-200/80 transition-all duration-200 group z-10"
          >
            <X className="w-5 h-5 text-gray-600 group-hover:scale-110 transition-transform duration-200" />
          </button>
          
          {/* Progress indicator */}
          <div className="flex justify-center mb-6">
            <div className="flex space-x-2">
              {tutorialSteps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToStep(index)}
                  disabled={isAnimating}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    index === currentStep 
                      ? 'bg-[#00d47e] scale-125' 
                      : index < currentStep 
                        ? 'bg-[#00d47e]/60' 
                        : 'bg-gray-300/60'
                  } ${isAnimating ? 'pointer-events-none' : 'cursor-pointer hover:scale-110'}`}
                />
              ))}
            </div>
          </div>
          
          {/* Main icon */}
          <div className={`mb-6 transition-all duration-500 ${isAnimating ? 'scale-75 opacity-50' : 'scale-100 opacity-100'}`}>
            <div className="relative w-20 h-20 mx-auto">
              <div className={`absolute inset-0 bg-gradient-to-br ${current.color} rounded-2xl shadow-xl`}></div>
              <div className={`absolute inset-0 bg-gradient-to-br ${current.color} rounded-2xl animate-pulse opacity-60`}></div>
              <div className="relative w-full h-full flex items-center justify-center">
                <IconComponent className="w-9 h-9 text-white drop-shadow-lg" />
              </div>
              {/* Animated rings */}
              <div className="absolute inset-0 rounded-2xl border-2 border-[#00d47e]/30 animate-ping"></div>
              <div className="absolute -inset-2 rounded-2xl border border-[#00d47e]/20 animate-pulse"></div>
            </div>
          </div>
          
          <div className={`text-center transition-all duration-500 ${isAnimating ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'}`}>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
              {current.title}
            </h2>
            <p className="text-[#00d47e] font-medium text-sm tracking-wide uppercase">
              {current.subtitle}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className={`px-6 pb-4 transition-all duration-500 ${isAnimating ? 'translate-x-8 opacity-0' : 'translate-x-0 opacity-100'}`}>
          <p className="text-center text-gray-600 leading-relaxed mb-6">
            {current.description}
          </p>
          
          {/* Features */}
          <div className="space-y-3 mb-6">
            {current.features.map((feature, index) => {
              const FeatureIcon = feature.icon;
              return (
                <div 
                  key={index}
                  className="flex items-center space-x-4 p-4 rounded-2xl bg-gradient-to-r from-gray-50/80 to-gray-100/60 backdrop-blur-sm hover:from-[#00d47e]/5 hover:to-[#00d47e]/10 transition-all duration-300 group"
                  style={{
                    animationDelay: `${index * 100}ms`
                  }}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00d47e]/20 to-[#00d47e]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <FeatureIcon className="w-5 h-5 text-[#00d47e]" />
                  </div>
                  <span className="text-gray-700 font-medium flex-1">{feature.text}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#00d47e] group-hover:translate-x-1 transition-all duration-200" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between p-6 pt-0 pb-8">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              prevStep();
            }}
            disabled={currentStep === 0 || isAnimating}
            className={`flex items-center space-x-2 px-4 py-3 rounded-2xl font-medium transition-all duration-200 touch-manipulation ${
              currentStep === 0 || isAnimating
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 hover:scale-105 active:scale-95 cursor-pointer'
            }`}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex-1 text-center">
            <span className="text-sm text-gray-500 font-medium">
              {currentStep + 1} of {tutorialSteps.length}
            </span>
          </div>

          {currentStep === tutorialSteps.length - 1 ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClose();
              }}
              disabled={isAnimating}
              className={`flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#00d47e] to-[#00b869] text-white font-semibold rounded-2xl shadow-lg shadow-[#00d47e]/25 hover:shadow-xl hover:shadow-[#00d47e]/35 transform hover:scale-105 active:scale-95 transition-all duration-200 touch-manipulation cursor-pointer ${
                isAnimating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <span>Get Started</span>
              <Zap className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                nextStep();
              }}
              disabled={isAnimating}
              className={`flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#00d47e] to-[#00b869] text-white font-semibold rounded-2xl shadow-lg shadow-[#00d47e]/25 hover:shadow-xl hover:shadow-[#00d47e]/35 transform hover:scale-105 active:scale-95 transition-all duration-200 touch-manipulation cursor-pointer ${
                isAnimating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-4 w-1 h-1 bg-[#00d47e] rounded-full animate-ping delay-500"></div>
        <div className="absolute bottom-32 right-6 w-1.5 h-1.5 bg-[#00d47e]/60 rounded-full animate-bounce delay-700"></div>
        <div className="absolute top-40 right-8 w-0.5 h-0.5 bg-[#00d47e] rounded-full animate-pulse delay-1000"></div>
        
        {/* Glow effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00d47e]/10 via-transparent to-[#00d47e]/10 rounded-3xl opacity-60 blur-xl -z-10"></div>
      </div>
    </div>
  );
};

export default TutorialModal;