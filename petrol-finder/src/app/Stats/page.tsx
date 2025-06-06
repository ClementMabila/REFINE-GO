'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { FaCar, FaBan, FaClock } from 'react-icons/fa'
import { Bell, Settings, Route, Shield, HelpCircle, Info } from 'lucide-react'
import Link from 'next/link'
import BottomNav from '../components/bottomNav'
import TripsModal from '../components/TripsModal'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation';

type Ride = {
  id: string
  date: string
  time?: string
  status: 'active' | 'completed' | 'cancelled'
  start_address: string
  destination_address: string
  actual_distance?: number
  planned_distance: number
  actual_duration?: number
  planned_duration: number
  points_earned: number
  bonus_points: number
  started_at: string
  completed_at?: string
  cancelled_at?: string
  cancellation_reason?: string
}

interface User {
    name: string;
    username: string;
    email: string;
    profilePicture: string | null;
}

type RidesByMonth = {
  month: string
  year: number
  rides: Ride[]
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://refine-go.onrender.com/api';

const mockUpcomingRides: Ride[] = []

export default function RideHistory() {
  const [tab, setTab] = useState<'upcoming' | 'past'>('past')
  const [darkMode, setDarkMode] = useState(false)
  const [rideHistory, setRideHistory] = useState<RidesByMonth[]>([])
  const [upcomingRides, setUpcomingRides] = useState<Ride[]>(mockUpcomingRides)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [csrfToken, setCsrfToken] = useState("")
  const [user, setUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);

  const router = useRouter();
  const [activeModal, setActiveModal] = useState<'safety' | 'support' | 'about' | null>(null);
    
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [open, setOpen] = useState(false)

  const modalRef = useRef<HTMLDivElement | null>(null);

  // Dark mode from localStorage - same logic as profile page
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode') === 'true'
    setDarkMode(savedMode)

    if (savedMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const openModal = (modalType: 'safety' | 'support' | 'about') => {
      setActiveModal(modalType);
    };

  const actions = [
    { icon: <Route size={20} />, label: 'My Trips', onClick: () => router.push('/Stats'), badge: 'NEW' },
    { icon: <Shield size={20} />, label: 'Safety', onClick: () => openModal('safety') },
    { icon: <HelpCircle size={20} />, label: 'Support', onClick: () => openModal('support'), badge: 'NEW' },
    { icon: <Info size={20} />, label: 'About', onClick: () => openModal('about') },
  ]

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
  }, []);

  // Fetch ride data
  useEffect(() => {
    if (csrfToken) {
      fetchRideHistory()
    }
  }, [csrfToken])

  const getAuthToken = () => {
    // Replace with your actual auth token retrieval method
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
  }

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

  useEffect(() => {
      // Fetch notifications when component mounts
      fetchNotifications();
    }, [fetchNotifications]);

  async function fetchRideHistory() {
    setLoading(true);
    setError(null);
    
    try {
      const authToken = getAuthToken()
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      }
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }

      const res = await fetch(`${API_BASE_URL}/api/history/`, {
        method: 'GET',
        headers,
        credentials: 'include', // important for session cookie
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data: RidesByMonth[] = await res.json();
      setRideHistory(data);
      
    } catch (error) {
      console.error('Failed to fetch ride history:', error);
      setError('Failed to load ride history. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const formatDistance = (distance?: number | string) => {
    if (!distance) return 'N/A'
    const numDistance = typeof distance === 'string' ? parseFloat(distance) : distance
    if (isNaN(numDistance)) return 'N/A'
    return `${numDistance.toFixed(1)} km`
  }

  const formatDuration = (duration?: number | string) => {
    if (!duration) return 'N/A'
    const numDuration = typeof duration === 'string' ? parseInt(duration) : duration
    if (isNaN(numDuration)) return 'N/A'
    const hours = Math.floor(numDuration / 60)
    const minutes = numDuration % 60
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  }

  const formatPoints = (earned: number, bonus: number) => {
    const total = earned + bonus
    return total > 0 ? `${total} pts` : ''
  }

  const getCancellationText = (reason?: string) => {
    const reasons = {
      'user_cancelled': 'Cancelled by you',
      'route_changed': 'Route changed',
      'destination_changed': 'Destination changed',
      'technical_issue': 'Technical issue',
      'other': 'Cancelled'
    }
    return reasons[reason as keyof typeof reasons] || 'Cancelled'
  }

  // Trip action functions
  const handleTripAction = async (tripId: string, action: 'complete' | 'cancel', data?: any) => {
    try {
      const authToken = getAuthToken()
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      }
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }
      
      const endpoint = action === 'complete' 
        ? `${API_BASE_URL}/api/trips/${tripId}/complete/`
        : `${API_BASE_URL}/api/trips/${tripId}/cancel/`
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(data || {})
      })
      
      if (response.ok) {
        // Refresh data after successful action
        await fetchRideHistory()
        return await response.json()
      } else {
        const error = await response.json()
        throw new Error(error.error || `Failed to ${action} trip`)
      }
    } catch (error) {
      console.error(`Error ${action}ing trip:`, error)
      throw error
    }
  }

  const refreshData = () => {
    fetchRideHistory()
  }

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="p-6">
          <div className="animate-pulse">
            <div className={`h-8 rounded w-32 mb-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className={`h-20 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="p-6">
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <button 
              onClick={refreshData}
              className="px-4 py-2 bg-[#2edda2] text-white rounded hover:bg-[#2edda2] transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    
    <div className={`min-h-screen ${darkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header - Same as profile page */}
      <header className={`sticky hidden md:block top-0 z-50 ${darkMode ? 'bg-black border-gray-700' : 'bg-white border-gray-200'} border-b shadow-sm`}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo and title */}
            <Link href="/Dashboard" passHref>
              <div className="flex items-center space-x-2 cursor-pointer">
                <button
                onClick={() => window.history.back()}
                className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-gray-800 text-[#2edda]' : 'hover:bg-gray-100 text-[#2edda]'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
                <div className="flex items-center space-x-3">
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
              {/* Notifications */}
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

              {/* Settings */}
              <button className={`hidden md:block p-3 rounded-full ${darkMode ? 'bg-[#3C4142]' : 'bg-gray-100'}`}>
                <Settings className="h-3 w-5" />
              </button>

              {/* User Avatar */}
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
                        <Link href="/profile" className="text-[#2edda2] mt-2 block hover:underline">
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

      {/* Main content */}
      <div className="p-4 md:p-6 max-w-4xl mx-auto pb-15">{/* Added pb-20 for bottom nav space */}
        <div className="flex items-center justify-between mb-6">
        <h1
          className={`text-2xl md:text-3xl font-semibold ${
            darkMode ? 'text-[#2edda2]' : 'text-[#2edda2]'
          }`}
        >
          Trips
        </h1>
        <button onClick={() => setShowModal(true)} title="About this page">
          <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-5 w-5 transition-colors duration-200 ${
            darkMode ? 'text-white hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"
          />
        </svg>
        </button>
      </div>

        {/* Tabs */}
        <div className={`flex space-x-8 border-b mb-6 ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}>
          <button
            className={`pb-3 px-1 text-s font-small transition-all duration-200 ${
              tab === 'upcoming'
                ? 'border-b-2 border-gray-400 text-gray-400 dark:text-gray-400'
                : `${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
            }`}
            onClick={() => setTab('upcoming')}
          >
            Upcoming ({upcomingRides.length})
          </button>
          <button
            className={`pb-3 px-1 text-s font-small transition-all duration-200 ${
              tab === 'past'
                ? 'border-b-2 border-gray-400 text-gray-400 dark:text-gray-400'
                : `${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
            }`}
            onClick={() => setTab('past')}
          >
            Past Rides
          </button>
        </div>

        {/* Content */}
        {tab === 'upcoming' ? (
          // Upcoming Rides
          <div className="space-y-4">
            {upcomingRides.length === 0 ? (
              <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <FaClock className="mx-auto text-4xl mb-4 opacity-50" />
                <p className="text-lg">No upcoming rides</p>
                <p className="text-sm">Plan your next trip to see it here</p>
              </div>
            ) : (
              upcomingRides.map((ride) => (
                <div
                  key={ride.id}
                  className={`rounded-xl p-4 md:p-5 border hover:shadow-md transition-shadow ${
                    darkMode 
                      ? 'bg-[#3C4142] border-gray-700' 
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex space-x-4 flex-1">
                      <div className="mt-1">
                        <FaClock className="text-blue-500 text-lg" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="font-semibold text-base">{ride.date}</span>
                          {ride.time && (
                            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {ride.time}
                            </span>
                          )}
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full font-medium">
                            Scheduled
                          </span>
                        </div>
                        <div className={`space-y-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          <p className="font-medium">From: {ride.start_address}</p>
                          <p className="font-medium">To: {ride.destination_address}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span>{formatDistance(ride.planned_distance)}</span>
                            <span>•</span>
                            <span>{formatDuration(ride.planned_duration)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button className={`ml-4 ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zM12 13a1 1 0 110-2 1 1 0 010 2zM12 20a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          // Past Rides History
          <div className="space-y-6">
            {rideHistory.length === 0 ? (
              <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <FaCar className="mx-auto text-4xl mb-4 opacity-50" />
                <p className="text-lg">No ride history yet</p>
                <p className="text-sm">Complete your first trip to see it here</p>
              </div>
            ) : (
              rideHistory.map(({ month, year, rides }) => (
                <div key={`${month}-${year}`} className="space-y-4">
                  <h2 className={`text-lg md:text-xl font-semibold border-b pb-2 ${
                    darkMode 
                      ? 'text-gray-300 border-gray-700' 
                      : 'text-gray-700 border-gray-200'
                  }`}>
                    {`${month} ${year}`}
                  </h2>
                  <div className="space-y-3">
                    {rides.map((ride) => (
                      <div
                        key={ride.id}
                        className={`rounded-xl p-4 md:p-5 border hover:shadow-md transition-shadow ${
                          darkMode 
                            ? 'bg-[#3C4142] border-gray-700' 
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex space-x-4 flex-1">
                            <div className="mt-1">
                              {ride.status === 'completed' ? (
                                <FaCar className="text-[#2edda2] text-lg" />
                              ) : (
                                <FaBan className={`text-lg ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-3 mb-2">
                                <span className="font-semibold text-base">{ride.date}</span>
                                {ride.time && (
                                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {ride.time}
                                  </span>
                                )}
                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                  ride.status === 'completed'
                                    ? 'bg-green-100 dark:bg-[#2edda2] text-white dark:text-white'
                                    : `${darkMode ? 'bg-[#2edda2] text-white' : 'bg-[#2edda2] text-white'}`
                                }`}>
                                  {ride.status === 'completed' ? 'Completed' : getCancellationText(ride.cancellation_reason)}
                                </span>
                              </div>
                              <div className={`space-y-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                <p className="font-medium">From: {ride.start_address}</p>
                                <p className="font-medium">To: {ride.destination_address}</p>
                                <div className="flex items-center space-x-4 mt-2">
                                  <span>{formatDistance(ride.actual_distance || ride.planned_distance)}</span>
                                  <span>•</span>
                                  <span>{formatDuration(ride.actual_duration || ride.planned_duration)}</span>
                                  {ride.status === 'completed' && formatPoints(ride.points_earned, ride.bonus_points) && (
                                    <>
                                      <span>•</span>
                                      <span className="text-blue-600 dark:text-blue-400 font-medium">
                                        {formatPoints(ride.points_earned, ride.bonus_points)}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          <button className={`ml-4 ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zM12 13a1 1 0 110-2 1 1 0 010 2zM12 20a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <TripsModal
          />
        )}
      </div>
      <div className='fixed bottom-0 left-0 w-full md:hidden'>
        {/* Bottom Navigation */}
        <BottomNav darkMode={darkMode} />
      </div>
    </div>
    
  )
}
