"use client"
import React, { useState, useEffect } from 'react';
import { Car, Fuel, MapPin, Trophy, TrendingUp, Gauge, Clock, Route, Award, Zap, Target, Star, Sparkles, Navigation, Battery, Shield, Wifi } from 'lucide-react';

const carBrands = [
  { name: 'Tesla', consumption: 0, icon: '⚡', color: 'from-red-500 to-red-600', electric: true },
  { name: 'BMW', consumption: 9.2, icon: '🏎️', color: 'from-blue-500 to-blue-600' },
  { name: 'Mercedes', consumption: 10.1, icon: '💎', color: 'from-gray-600 to-gray-700' },
  { name: 'Audi', consumption: 8.9, icon: '🔥', color: 'from-red-600 to-red-700' },
  { name: 'Toyota', consumption: 7.5, icon: '🌟', color: 'from-green-500 to-green-600' },
  { name: 'Honda', consumption: 6.8, icon: '⭐', color: 'from-blue-400 to-blue-500' },
  { name: 'Porsche', consumption: 11.5, icon: '🚀', color: 'from-yellow-500 to-orange-500' },
  { name: 'Ferrari', consumption: 14.2, icon: '🏁', color: 'from-red-500 to-pink-500' },
  { name: 'Lamborghini', consumption: 15.8, icon: '⚡', color: 'from-purple-500 to-pink-500' },
  { name: 'McLaren', consumption: 13.1, icon: '🎯', color: 'from-orange-500 to-red-500' }
];

const mockUserData = {
  name: 'Alex Johnson',
  totalRefills: 47,
  points: 12340,
  currentFuel: 68,
  tankCapacity: 60,
  level: 'Diamond Elite',
  lastRefill: {
    amount: 45.5,
    cost: 890.50,
    station: 'Shell Sandton City',
    date: '2025-05-28',
    time: '14:30'
  },
  estimatedRange: 420,
  avgConsumption: 7.8,
  weeklyDistance: 280,
  ecoScore: 89,
  streakDays: 12
};

function RefineGoDashboard() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [carModel, setCarModel] = useState('');
  const [fuelLevel, setFuelLevel] = useState(mockUserData.currentFuel);
  const [animateStats, setAnimateStats] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (isRegistered) {
      setShowWelcome(true);
      setTimeout(() => setAnimateStats(true), 800);
      setTimeout(() => setShowWelcome(false), 3000);
    }
  }, [isRegistered]);

  const handleRegister = () => {
    if (selectedBrand && carModel) {
      setIsRegistered(true);
    }
  };

  const PremiumFuelTank = () => {
    const percentage = (fuelLevel / mockUserData.tankCapacity) * 100;
    
    return (
      <div className="relative w-full max-w-sm mx-auto mb-8">
        {/* Glowing background effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-3xl blur-xl"></div>
        
        {/* Main tank container */}
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 border border-slate-700/50 backdrop-blur-sm">
          {/* Car visualization */}
          <div className="relative w-full h-32 mb-6">
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Car body */}
              <div className="relative w-48 h-20">
                <div className="w-full h-full bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 rounded-2xl shadow-2xl border border-slate-500/30">
                  {/* Car windows */}
                  <div className="absolute top-1 left-8 w-12 h-6 bg-gradient-to-b from-blue-400/80 to-blue-500/60 rounded-t-lg"></div>
                  <div className="absolute top-1 right-8 w-12 h-6 bg-gradient-to-b from-blue-400/80 to-blue-500/60 rounded-t-lg"></div>
                  
                  {/* Headlights */}
                  <div className="absolute top-6 left-0 w-3 h-4 bg-gradient-to-r from-yellow-300 to-yellow-400 rounded-r-full shadow-lg shadow-yellow-400/50"></div>
                  <div className="absolute top-6 right-0 w-3 h-4 bg-gradient-to-l from-yellow-300 to-yellow-400 rounded-l-full shadow-lg shadow-yellow-400/50"></div>
                  
                  {/* Brand badge */}
                  <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-xs font-bold text-white/80">
                    {selectedBrand}
                  </div>
                </div>
                
                {/* Wheels */}
                <div className="absolute -bottom-2 left-4 w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-800 rounded-full border-2 border-slate-400/50"></div>
                <div className="absolute -bottom-2 right-4 w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-800 rounded-full border-2 border-slate-400/50"></div>
              </div>
            </div>
          </div>

          {/* Advanced fuel gauge */}
          <div className="relative w-32 h-40 mx-auto">
            {/* Outer glow ring */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-slate-700 to-slate-800 shadow-inner">
              {/* Inner tank */}
              <div className="absolute inset-2 rounded-xl bg-slate-900 overflow-hidden border border-slate-600/50">
                {/* Fuel liquid with wave animation */}
                <div 
                  className={`absolute bottom-0 w-full transition-all duration-2000 ease-out ${
                    percentage > 70 ? 'bg-gradient-to-t from-emerald-500 via-emerald-400 to-emerald-300' :
                    percentage > 40 ? 'bg-gradient-to-t from-amber-500 via-amber-400 to-amber-300' :
                    'bg-gradient-to-t from-red-500 via-red-400 to-red-300'
                  }`}
                  style={{ height: `${percentage}%` }}
                >
                  {/* Animated waves */}
                  <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-0 w-full h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                  {/* Fuel particles */}
                  <div className="absolute inset-0 overflow-hidden">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-1 h-1 bg-white rounded-full animate-bounce opacity-60"
                        style={{
                          left: `${20 + i * 15}%`,
                          animationDelay: `${i * 0.3}s`,
                          animationDuration: '2s'
                        }}
                      ></div>
                    ))}
                  </div>
                </div>
                
                {/* Fuel level indicators */}
                <div className="absolute right-1 top-2 text-xs text-slate-400 space-y-4">
                  <div className={`w-2 h-0.5 ${percentage > 80 ? 'bg-emerald-400' : 'bg-slate-600'}`}></div>
                  <div className={`w-2 h-0.5 ${percentage > 60 ? 'bg-emerald-400' : 'bg-slate-600'}`}></div>
                  <div className={`w-2 h-0.5 ${percentage > 40 ? 'bg-amber-400' : 'bg-slate-600'}`}></div>
                  <div className={`w-2 h-0.5 ${percentage > 20 ? 'bg-red-400' : 'bg-slate-600'}`}></div>
                </div>
              </div>
            </div>
            
            {/* Digital display */}
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-800 rounded-lg px-3 py-1 border border-slate-600/50">
              <div className="text-center">
                <div className="text-lg font-bold text-white">{Math.round(percentage)}%</div>
                <div className="text-xs text-slate-400">{fuelLevel}L</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  type PremiumStatCardProps = {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    value: React.ReactNode;
    subtitle?: string;
    gradient: string;
    delay?: number;
    pulse?: boolean;
  };

  const PremiumStatCard: React.FC<PremiumStatCardProps> = ({ icon: Icon, title, value, subtitle, gradient, delay = 0, pulse = false }) => (
    <div 
      className={`relative overflow-hidden rounded-2xl transition-all duration-700 transform hover:scale-105 ${
        animateStats ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-90`}></div>
      
      {/* Glass effect overlay */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm border border-white/20"></div>
      
      {/* Content */}
      <div className="relative p-6 text-white">
        <div className="flex items-center justify-between mb-3">
          <Icon className={`w-8 h-8 ${pulse ? 'animate-pulse' : ''}`} />
          {pulse && <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>}
        </div>
        <h3 className="text-sm font-medium opacity-90 uppercase tracking-wider">{title}</h3>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {subtitle && <p className="text-sm opacity-80 mt-1">{subtitle}</p>}
      </div>
      
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>
    </div>
  );

  const WelcomeAnimation = () => (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm transition-opacity duration-1000 ${showWelcome ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="text-center text-white transform transition-all duration-1000">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-bounce">
          <Sparkles className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-bold mb-2">Welcome to Refine Go!</h2>
        <p className="text-xl text-slate-300">Your {selectedBrand} {carModel} is ready</p>
        <div className="flex justify-center mt-4 space-x-1">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: `${i * 0.2}s`}}></div>
          ))}
        </div>
      </div>
    </div>
  );

  if (!isRegistered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 p-4 relative overflow-hidden">
        {/* Animated background particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            ></div>
          ))}
        </div>

        <div className="relative max-w-md mx-auto pt-12">
          {/* Premium header */}
          <div className="text-center mb-12">
            <div className="relative w-28 h-28 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl animate-pulse"></div>
              <div className="absolute inset-1 bg-gradient-to-br from-blue-400 to-purple-600 rounded-3xl flex items-center justify-center">
                <Car className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent mb-3">
              Refine Go
            </h1>
            <p className="text-slate-300 text-lg">Premium Fuel Management</p>
            <div className="flex justify-center mt-4 space-x-2">
              <div className="px-3 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full border border-blue-400/30 text-blue-300 text-sm">
                AI Powered
              </div>
              <div className="px-3 py-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full border border-green-400/30 text-green-300 text-sm">
                Smart Analytics
              </div>
            </div>
          </div>

          {/* Premium registration form */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-3xl blur-xl"></div>
            <div className="relative bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-2xl">
              <div className="p-8 space-y-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-white font-semibold mb-4 text-lg">Choose Your Vehicle Brand</label>
                    <div className="grid grid-cols-2 gap-3">
                      {carBrands.map((brand) => (
                        <button
                          key={brand.name}
                          onClick={() => setSelectedBrand(brand.name)}
                          className={`relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-300 transform hover:scale-105 ${
                            selectedBrand === brand.name 
                              ? `bg-gradient-to-br ${brand.color} shadow-lg shadow-blue-500/25 scale-105` 
                              : 'bg-slate-700/50 hover:bg-slate-600/50'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{brand.icon}</span>
                            <div>
                              <div className="text-white font-semibold text-sm">{brand.name}</div>
                              <div className="text-slate-300 text-xs">
                                {brand.electric ? 'Electric' : `${brand.consumption}L/100km`}
                              </div>
                            </div>
                          </div>
                          {selectedBrand === brand.name && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                              <div className="w-3 h-3 bg-white rounded-full"></div>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-3 text-lg">Vehicle Model</label>
                    <input
                      type="text"
                      placeholder="e.g., Model S, X5, C-Class"
                      className="w-full bg-slate-700/50 backdrop-blur-sm border border-slate-600/50 rounded-2xl px-6 py-4 text-white placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 focus:outline-none transition-all duration-300"
                      value={carModel}
                      onChange={(e) => setCarModel(e.target.value)}
                    />
                  </div>

                  <button 
                    onClick={handleRegister}
                    disabled={!selectedBrand || !carModel}
                    className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-300 relative overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center justify-center space-x-2">
                      <Zap className="w-5 h-5" />
                      <span>Launch My Dashboard</span>
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-full hover:translate-x-[-200%] transition-transform duration-1000"></div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 relative overflow-hidden">
      <WelcomeAnimation />
      
      {/* Animated background */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/10 rounded-full animate-twinkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`
            }}
          ></div>
        ))}
      </div>

      <div className="relative max-w-md mx-auto p-4">
        {/* Premium header with user level */}
        <div className="text-center mb-8 pt-8">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/25">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center">
                <Star className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-white">Welcome back</h1>
              <p className="text-blue-300 font-semibold">{mockUserData.name}</p>
              <div className="flex items-center space-x-2 mt-1">
                <div className="px-2 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-full border border-yellow-400/30">
                  <span className="text-yellow-300 text-xs font-semibold">{mockUserData.level}</span>
                </div>
                <div className="text-white text-sm">{mockUserData.points.toLocaleString()} pts</div>
              </div>
            </div>
          </div>
          <p className="text-slate-300">{selectedBrand} {carModel}</p>
        </div>

        {/* Premium fuel tank */}
        <PremiumFuelTank />

        {/* Smart range prediction */}
        <div className="mb-8">
          <div className="relative bg-gradient-to-br from-emerald-500/20 to-blue-500/20 backdrop-blur-xl rounded-3xl border border-emerald-400/30 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Navigation className="w-6 h-6 text-emerald-400" />
                <span className="text-white font-semibold">Smart Range AI</span>
              </div>
              <div className="px-3 py-1 bg-emerald-500/20 rounded-full border border-emerald-400/30">
                <span className="text-emerald-300 text-sm">Live</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">{mockUserData.estimatedRange} km</div>
              <p className="text-slate-300 mb-4">Estimated range remaining</p>
              <div className="bg-slate-800/50 rounded-2xl p-4">
                <p className="text-sm text-slate-300">
                  Based on your driving patterns, this fuel will last approximately 
                  <span className="font-bold text-emerald-400"> 6-8 days</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Premium stats grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <PremiumStatCard
            icon={Fuel}
            title="Eco Score"
            value={`${mockUserData.ecoScore}%`}
            subtitle="Efficiency rating"
            gradient="from-green-500 to-emerald-600"
            delay={100}
          />
          <PremiumStatCard
            icon={Target}
            title="Streak"
            value={`${mockUserData.streakDays} days`}
            subtitle="Refill streak"
            gradient="from-orange-500 to-red-500"
            delay={200}
            pulse={true}
          />
          <PremiumStatCard
            icon={TrendingUp}
            title="Weekly Km"
            value={mockUserData.weeklyDistance}
            subtitle="This week"
            gradient="from-blue-500 to-purple-600"
            delay={300}
          />
          <PremiumStatCard
            icon={Award}
            title="Total Refills"
            value={mockUserData.totalRefills}
            subtitle="All time"
            gradient="from-purple-500 to-pink-500"
            delay={400}
          />
        </div>

        {/* Premium last refill section */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-3xl blur-xl"></div>
          <div className="relative bg-slate-800/30 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                <Zap className="w-6 h-6 text-yellow-400" />
                <span>Last Refill</span>
              </h3>
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                +250 pts
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-2xl">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Fuel className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">{mockUserData.lastRefill.amount}L</p>
                    <p className="text-slate-400 text-sm">Amount filled</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">R{mockUserData.lastRefill.cost}</p>
                  <p className="text-slate-400 text-sm">Total cost</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-2xl">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">{mockUserData.lastRefill.station}</p>
                    <p className="text-slate-400 text-sm">Station location</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">{mockUserData.lastRefill.time}</p>
                  <p className="text-slate-400 text-sm">{mockUserData.lastRefill.date}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl border border-blue-400/20">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="w-5 h-5 text-blue-400" />
                <span className="text-blue-300 font-semibold text-sm">AI Prediction</span>
              </div>
              <p className="text-slate-300 text-sm">
                Your recent {mockUserData.lastRefill.amount}L refill will provide optimal range for your typical 
                <span className="font-bold text-blue-400"> {mockUserData.weeklyDistance}km weekly</span> driving pattern.
                Estimated to last <span className="font-bold text-emerald-400">6-8 days</span> with current efficiency.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 1; }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-twinkle {
          animation: twinkle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default RefineGoDashboard;