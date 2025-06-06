import React, { useState, useEffect } from 'react';
import { X, Shield, HelpCircle, Info, CheckCircle2, Phone, Mail, Clock, Award, Lock, Users } from 'lucide-react';

type BaseModalProps = {
  showModal: boolean;
  onClose: () => void;
  children: React.ReactElement<{ onClose: () => void }>;
};

const BaseModal = ({ showModal, onClose, children }: BaseModalProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (showModal) {
      setTimeout(() => setIsVisible(true), 50);
    }
  }, [showModal]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div 
        className={`relative bg-white/95 backdrop-blur-xl dark:bg-gray-900/95 w-full max-w-sm rounded-3xl shadow-2xl border border-gray-200/20 dark:border-gray-700/30 transform transition-all duration-300 ease-out ${
          isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm flex items-center justify-center hover:bg-gray-200/80 dark:hover:bg-gray-700/80 transition-all duration-200 group z-10"
        >
          <X className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:scale-110 transition-transform duration-200" />
        </button>
        
        {React.cloneElement(children, { onClose: handleClose })}
        
        {/* Subtle glow effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#2edda2]/20 via-transparent to-[#2edda2]/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl"></div>
      </div>
    </div>
  );
};

const SafetyModal = ({ onClose }: { onClose: () => void }) => {
  return (
    <>
      {/* Header with animated gradient */}
      <div className="relative overflow-hidden rounded-t-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent"></div>
        <div className="relative p-6 pb-4">
          {/* Animated icon container */}
          <div className="mb-4">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg shadow-emerald-500/25"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl animate-pulse opacity-75"></div>
              <div className="relative w-full h-full flex items-center justify-center">
                <Shield className="w-7 h-7 text-white drop-shadow-sm" />
              </div>
              {/* Floating animation dots */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-bounce delay-100"></div>
              <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-emerald-400/60 rounded-full animate-bounce delay-300"></div>
            </div>
          </div>
          
          <h2 className="text-xl font-semibold text-center bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Safety First
          </h2>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-2">
        <p className="text-center text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
          Your safety is our top priority. We've implemented comprehensive security measures to protect you and your data throughout your journey.
        </p>
        
        {/* Feature highlights */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/50 backdrop-blur-sm">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Lock className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300">End-to-end encryption</span>
          </div>
          
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/50 backdrop-blur-sm">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Award className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300">Verified fuel stations</span>
          </div>
          
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/50 backdrop-blur-sm">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300">Real-time monitoring</span>
          </div>
        </div>
      </div>

      {/* Bottom action */}
      <div className="p-6 pt-0">
        <button
          onClick={onClose}
          className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-2xl shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          Stay Safe
        </button>
      </div>
    </>
  );
};

const SupportModal = ({ onClose }: { onClose: () => void }) => {
  return (
    <>
      {/* Header with animated gradient */}
      <div className="relative overflow-hidden rounded-t-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent"></div>
        <div className="relative p-6 pb-4">
          {/* Animated icon container */}
          <div className="mb-4">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg shadow-blue-500/25"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl animate-pulse opacity-75"></div>
              <div className="relative w-full h-full flex items-center justify-center">
                <HelpCircle className="w-7 h-7 text-white drop-shadow-sm" />
              </div>
              {/* Floating animation dots */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-bounce delay-100"></div>
              <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-400/60 rounded-full animate-bounce delay-300"></div>
            </div>
          </div>
          
          <h2 className="text-xl font-semibold text-center bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            24/7 Support
          </h2>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-2">
        <p className="text-center text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
          Need assistance? Our dedicated support team is here to help you 24/7. Get instant solutions to your queries and technical issues.
        </p>
        
        {/* Feature highlights */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/50 backdrop-blur-sm">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300">24/7 availability</span>
          </div>
          
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/50 backdrop-blur-sm">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Phone className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300">Live chat & phone support</span>
          </div>
          
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/50 backdrop-blur-sm">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Mail className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300">Email & ticket system</span>
          </div>
        </div>
      </div>

      {/* Bottom action */}
      <div className="p-6 pt-0">
        <button
          onClick={onClose}
          className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          Get Help
        </button>
      </div>
    </>
  );
};

const AboutModal = ({ onClose }: { onClose: () => void }) => {
  return (
    <>
      {/* Header with animated gradient */}
      <div className="relative overflow-hidden rounded-t-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent"></div>
        <div className="relative p-6 pb-4">
          {/* Animated icon container */}
          <div className="mb-4">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg shadow-purple-500/25"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl animate-pulse opacity-75"></div>
              <div className="relative w-full h-full flex items-center justify-center">
                <Info className="w-7 h-7 text-white drop-shadow-sm" />
              </div>
              {/* Floating animation dots */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full animate-bounce delay-100"></div>
              <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-purple-400/60 rounded-full animate-bounce delay-300"></div>
            </div>
          </div>
          
          <h2 className="text-xl font-semibold text-center bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            About Us
          </h2>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-2">
        <p className="text-center text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
          Revolutionizing fuel management with smart technology. We connect drivers to trusted fuel stations while providing seamless tracking and management tools.
        </p>
        
        {/* Feature highlights */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/50 backdrop-blur-sm">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-purple-500" />
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300">50,000+ active users</span>
          </div>
          
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/50 backdrop-blur-sm">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-purple-500" />
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300">1000+ partner stations</span>
          </div>
          
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/50 backdrop-blur-sm">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Award className="w-4 h-4 text-purple-500" />
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300">Award-winning platform</span>
          </div>
        </div>
      </div>

      {/* Bottom action */}
      <div className="p-6 pt-0">
        <button
          onClick={onClose}
          className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium rounded-2xl shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          Learn More
        </button>
      </div>
    </>
  );
};



export default BaseModal;
export { SafetyModal, SupportModal, AboutModal, BaseModal };