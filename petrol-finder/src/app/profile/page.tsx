"use client"

import React, { useState} from 'react';
import { Home, MapPin, Fuel, Sun, User, Moon, Settings, Search, Pencil ,  Route, Heart, HelpCircle, Bell, Fingerprint, Edit, LogOut, ChevronRight, Menu } from 'lucide-react';
import { useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import BottomNav from '../components/bottomNav'
import ProfileAvatar from '../components/profileAvatar'
import TutorialModal from '../components/TutorialModal';
import FavoritesModal from '../components/FavoritesModal';
import { useRouter } from 'next/navigation';

const ProfilePage = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [faceId, setFaceId] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [show, setShow] = useState(false);  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const router = useRouter();

  const colorOptions = ['#ffa8ec', '#FFD700', '#7FFFD4', '#FF4500', '#9370DB', '#20B2AA'];
  const [showTutorial, setShowTutorial] = useState(false);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);

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

  const [user, setUser] = useState<User | null>(null);
  const [csrfToken, setCsrfToken] = useState("");
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://refine-go.onrender.com';
  
    useEffect(() => {
    const fetchCsrfAndUser = async () => {
        try {
        const response = await fetch(`${API_BASE_URL}/api/csrf-token/`, {
            credentials: 'include',
        });
        const data = await response.json();
        const token = data.csrfToken;
        setCsrfToken(token);

        const userRes = await fetch(`${API_BASE_URL}/api/api/get-profile/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': token,
          },
          credentials: 'include',
        });
        const userData = await userRes.json();
        console.log('User data:', userData); // Debugging line
        setUser(userData|| null);
        } catch (error) {
        console.error('Failed to fetch CSRF token or user:', error);
        setUser(null);
        setError('Failed to fetch user info');
        } finally {
        setLoading(false);
        }
    };

    fetchCsrfAndUser();
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
      console.log('User data:', data); // Debugging line
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
  
  const handleLogout = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/logout/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken, // Make sure you have this from earlier
      },
      credentials: 'include', // Include session cookies
    });

    const data = await res.json();

    if (res.ok && data.success) {
      setUser(null); // Clear local user state
      // Redirect or refresh
      window.location.href = '/Login'; // or a route you prefer
    } else {
      console.error('Logout failed:', data.error || 'Unknown error');
    }
  } catch (error) {
    console.error('Logout request error:', error);
  }
};

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
      if (!showUserMenu) {
        fetchUser();
      }
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

  // Mock user data
  // Removed duplicate 'user' declaration to avoid redeclaration error.

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

interface User {
    name: string;
    username: string;
    email: string;
    profile_picture: string | null;
}

  type ToggleSwitchProps = {
    isOn: boolean;
    onToggle: () => void;
    label: string;
    icon: React.ElementType;
  };

  const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ isOn, onToggle, label, icon: Icon }) => (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${darkMode ? 'bg-black' : 'bg-gray-100'}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="font-medium">{label}</span>
      </div>
      <button
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
          isOn ? 'bg-green-500' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
            isOn ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
    
  );

  useEffect(() => {
    // Fetch notifications when component mounts
    fetchNotifications();
  }, [fetchNotifications]);
  
  type MenuItemProps = {
    icon: React.ElementType;
    label: string;
    onClick: () => void;
    showChevron?: boolean;
  };

  const MenuItem: React.FC<MenuItemProps> = ({ icon: Icon, label, onClick, showChevron = true }) => (
    <button
      onClick={onClick}
      className="flex items-center justify-between w-full py-4 hover:bg-opacity-50 hover:bg-gray-400 rounded-lg px-2 transition-colors duration-200"
    >
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${darkMode ? 'bg-black' : 'bg-gray-100'}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="font-medium">{label}</span>
      </div>
      {showChevron && <ChevronRight className="h-5 w-5 text-gray-400" />}
    </button>
  );

  const Divider = () => (
    <div className="flex justify-center">
      <div className={`h-px w-3/4 ${darkMode ? 'bg-gray-500' : 'bg-gray-200'}`} />
    </div>
  );

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header placeholder - you can replace this with your actual header */}
      <header className={`sticky hidden md:block top-0 z-50 ${darkMode ? 'bg-black border-gray-700' : 'bg-white border-gray-200'} border-b shadow-sm`}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo and title */}
            <Link href="/Dashboard" passHref>
              <div className="flex items-center space-x-2 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <button
                onClick={() => window.history.back()}
                className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
                  <div className={`w-8 h-8 rounded-lg ${darkMode ? 'bg-white' : 'bg-[#2edda2]'} flex items-center justify-center`}>
                    <span className={`font-bold text-sm ${darkMode ? 'text-black' : 'text-white'}`}>R</span>
                  </div>
                  <h1 className="text-xl font-bold bg-[#2edda2] bg-clip-text text-transparent">
                    RefineGo
                  </h1>
                </div>
              </div>
            </Link>
            
            {/* User actions */}
            <div className="flex items-center space-x-3">
              
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
                className={`p-3 rounded-full relative ${darkMode ? 'bg-[#3C4142]' : 'bg-gray-100'}`}
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

              <button className={`hidden md:block p-3 rounded-full ${darkMode ? 'bg-[#3C4142]' : 'bg-gray-100'}`}>
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
                  title={user ? `Logged in as ${user.name}` : 'Login'}
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

      {/* Main content */}
      <div className="flex-1 px-4 py-6 max-w-md mx-auto">
        {/* Profile section */}
        <div className="text-center mb-8">
          {/* Profile picture or initials */}
          <div className="mb-4">
            {user && user.profile_picture ? (
              <img
                src={user.profile_picture}
                alt="Profile"
                className="w-24 h-24 rounded-full mx-auto object-cover"
              />
            ) : (
              <ProfileAvatar user={user} />
            )}
          </div>
          
          {/* User email */}
          <p className={`text-sm mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {user?.email}
          </p>
          
          {/* Edit profile button */}
          <button
            onClick={() => router.push('/UserDetails')}
            className={`px-8 py-3 rounded-full font-medium transition-colors duration-200 ${
              darkMode
                ? 'bg-[#3C4142] text-white hover:bg-gray-400'
                : 'bg-black text-white hover:bg-[#25c993]'
            }`}
          >
            Edit Profile
          </button>

        </div>

        {/* Quick actions */}
        <div className={`rounded-2xl p-6 mb-6 ${darkMode ? 'bg-[#3C4142]' : 'bg-gray-100'} shadow-sm`}>
          <MenuItem 
            icon={Heart} 
            label="Favorites" 
            onClick={() => setShowFavoritesModal(true)}
          />
          
          <Divider />
          
          <MenuItem
            icon={HelpCircle}
            label="Support"
            onClick={() => setShowTutorial(true)}
          />
        </div>
        {showTutorial && <TutorialModal onClose={() => setShowTutorial(false)} />}
        {showFavoritesModal && (
          <FavoritesModal
            showModal={showFavoritesModal}
            onClose={() => setShowFavoritesModal(false)}
          />
        )}
        {/* Settings */}
        <div className={`rounded-2xl p-6 mb-6 ${darkMode ? 'bg-[#3C4142]' : 'bg-gray-100'} shadow-sm`}>
          <ToggleSwitch
            isOn={pushNotifications}
            onToggle={() => setPushNotifications(!pushNotifications)}
            label="Push Notifications"
            icon={Bell}
          />
          
          <Divider />
          
          <ToggleSwitch
            isOn={faceId}
            onToggle={() => setFaceId(!faceId)}
            label="Face ID"
            icon={Fingerprint}
          />
          
          <Divider />
          
          <MenuItem 
            icon={Edit} 
            label="Edit Profile" 
            onClick={() => router.push('/UserDetails')} 
          />
          
          <Divider />
          
          <MenuItem 
            icon={LogOut} 
            label="Logout" 
            onClick={handleLogout}
            showChevron={false}
          />
        </div>
      </div>
      {/* Bottom navigation for mobile */}
      <div className='fixed bottom-0 left-0 w-full md:hidden'>
        <BottomNav darkMode={darkMode} />
      </div>
    </div>
  );
};

export default ProfilePage;
