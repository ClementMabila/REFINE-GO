"use client"

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Edit3, Camera, Check, X, ChevronDown } from 'lucide-react';
import Link from 'next/link';

interface User {
  id: number;
  username: string;
  email: string;
  phone_number: string;
  preferred_fuel_type: string;
  profile_picture: string | null;
  first_name: string;
  last_name: string;
}

const EditProfilePage = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState("");
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValues, setTempValues] = useState<{ [key: string]: string }>({});
  const [updating, setUpdating] = useState(false);
  const [showFuelDropdown, setShowFuelDropdown] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://refine-go.onrender.com';

  const fuelTypes = [
    'Petrol',
    'Diesel',
    'Electric',
    'Hybrid',
    'LPG',
    'CNG'
  ];

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedMode);
    if (savedMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    const fetchCsrfAndUser = async () => {
      try {
        // Fetch CSRF token
        const csrfResponse = await fetch(`${API_BASE_URL}/api/csrf-token/`, {
          credentials: 'include',
        });
        const csrfData = await csrfResponse.json();
        const token = csrfData.csrfToken;
        setCsrfToken(token);

        // Fetch user data
        const userResponse = await fetch(`${API_BASE_URL}/api/api/get-profile/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': token,
          },
          credentials: 'include',
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          console.log('User data:', userData);
          setUser(userData);
          // Initialize temp values
          setTempValues({
            username: userData.username || '',
            email: userData.email || '',
            phone_number: userData.phone_number || '',
            preferred_fuel_type: userData.preferred_fuel_type || '',
            first_name: userData.first_name || '',
            last_name: userData.last_name || '',
          });
        } else {
          setError('Failed to fetch profile data');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchCsrfAndUser();
  }, [API_BASE_URL]);

  const handleEdit = (field: string) => {
    setEditingField(field);
    if (user) {
      setTempValues(prev => ({
        ...prev,
        [field]: user[field as keyof User] as string || ''
      }));
    }
  };

  const handleSave = async (field: string) => {
    if (!user || !tempValues[field]) return;

    setUpdating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/api/user-update/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({
          [field]: tempValues[field]
        }),
      });
      console.log('Saving field:', field, 'with value:', tempValues[field]);

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        setEditingField(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update error:', error);
      setError('Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    setEditingField(null);
    setTempValues(prev => {
      const reset = { ...prev };
      if (user && editingField) {
        reset[editingField] = user[editingField as keyof User] as string || '';
      }
      return reset;
    });
    setShowFuelDropdown(false);
  };

  const handleProfilePictureChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size should be less than 5MB');
      return;
    }

    setUpdating(true);
    const formData = new FormData();
    formData.append('profile_picture', file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/api/user-update/`, {
        method: 'PATCH',
        headers: {
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
        body: formData,
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update profile picture');
      }
    } catch (error) {
      console.error('Profile picture update error:', error);
      setError('Failed to update profile picture');
    } finally {
      setUpdating(false);
    }
  };

  const ProfileField = ({ 
    label, 
    value, 
    field, 
    type = 'text',
    placeholder = ''
  }: {
    label: string;
    value: string;
    field: string;
    type?: string;
    placeholder?: string;
  }) => {
    const isEditing = editingField === field;
    const displayValue = value || 'Not set';

    return (
      <div className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className={`text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {label}
            </p>
            {isEditing ? (
              field === 'preferred_fuel_type' ? (
                <div className="relative">
                  <button
                    onClick={() => setShowFuelDropdown(!showFuelDropdown)}
                    className={`w-full p-3 rounded-lg text-left flex items-center justify-between ${
                      darkMode ? 'bg-black border-gray-600' : 'bg-white border-gray-300'
                    } border`}
                  >
                    <span>{tempValues[field] || 'Select fuel type'}</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  {showFuelDropdown && (
                    <div className={`absolute z-10 w-full mt-1 rounded-lg shadow-lg ${
                      darkMode ? 'bg-black border-gray-600' : 'bg-white border-gray-300'
                    } border max-h-48 overflow-y-auto`}>
                      {fuelTypes.map((fuel) => (
                        <button
                          key={fuel}
                          onClick={() => {
                            setTempValues(prev => ({ ...prev, [field]: fuel }));
                            setShowFuelDropdown(false);
                          }}
                          className={`w-full p-3 text-left hover:bg-opacity-50 hover:bg-gray-400 ${
                            tempValues[field] === fuel ? 'bg-[#2edda2] text-white' : ''
                          }`}
                        >
                          {fuel}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <input
                  type={type}
                  value={tempValues[field] || ''}
                  onChange={(e) => setTempValues(prev => ({ ...prev, [field]: e.target.value }))}
                  placeholder={placeholder}
                  className={`w-full p-3 rounded-lg ${
                    darkMode ? 'bg-black border-gray-600 text-white' : 'bg-white border-gray-300'
                  } border focus:outline-none focus:ring-2 focus:ring-[#2edda2]`}
                  autoFocus
                />
              )
            ) : (
              <p className="font-medium text-base">{displayValue}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            {isEditing ? (
              <>
                <button
                  onClick={() => handleSave(field)}
                  disabled={updating}
                  className="p-2 rounded-full bg-[#2edda2] text-white hover:bg-[#18f3a9] disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={handleCancel}
                  disabled={updating}
                  className="p-2 rounded-full bg-[#ff593c] text-white hover:bg-[#ff593c] disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => handleEdit(field)}
                className={`p-2 rounded-full ${
                  darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <Edit3 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const Divider = () => (
    <div className="flex justify-center">
      <div className={`h-px w-full ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`} />
    </div>
  );

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2edda2] border-t-transparent mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Link href="/profile" className="text-[#2edda2] hover:underline">
            Back to Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 ${darkMode ? 'bg-black border-gray-700' : 'bg-white border-gray-200'} border-b`}>
        <div className="flex items-center justify-between px-4 py-4">
          <Link href="/profile" className="p-2 rounded-full hover:bg-[#2edda2] dark:hover:bg-[#2edda2]">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold">Edit Profile</h1>
          <div className="w-10"></div> {/* Spacer */}
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 px-4 py-6 max-w-md mx-auto">
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
            {error}
            <button onClick={() => setError(null)} className="float-right">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Profile Picture Section */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            {user?.profile_picture ? (
              <img
                src={user.profile_picture}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover mx-auto"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-[#2edda2] flex items-center justify-center mx-auto">
                <span className="text-white text-2xl font-bold">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={updating}
              className="absolute bottom-0 right-0 p-2 bg-[#2edda2] text-white rounded-full hover:bg-[#25c993] disabled:opacity-50"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleProfilePictureChange}
            className="hidden"
          />
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Tap the camera icon to change photo
          </p>
        </div>

        {/* Profile Fields */}
        {user && (
          <div className={`rounded-2xl p-6 ${darkMode ? 'bg-[#3C4142]' : 'bg-white'} shadow-sm`}>
            <ProfileField
              label="First Name"
              value={user.first_name}
              field="first_name"
              placeholder="Enter your first name"
            />
            <Divider />
            
            <ProfileField
              label="Last Name"
              value={user.last_name}
              field="last_name"
              placeholder="Enter your last name"
            />
            <Divider />
            
            <ProfileField
              label="Username"
              value={user.username}
              field="username"
              placeholder="Enter your username"
            />
            <Divider />
            
            <ProfileField
              label="Email"
              value={user.email}
              field="email"
              type="email"
              placeholder="Enter your email"
            />
            <Divider />
            
            <ProfileField
              label="Phone Number"
              value={user.phone_number}
              field="phone_number"
              type="tel"
              placeholder="Enter your phone number"
            />
            <Divider />
            
            <ProfileField
              label="Preferred Fuel Type"
              value={user.preferred_fuel_type}
              field="preferred_fuel_type"
            />
          </div>
        )}

        {updating && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`p-6 rounded-lg ${darkMode ? 'bg-black' : 'bg-white'}`}>
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2edda2] border-t-transparent mx-auto mb-4"></div>
              <p>Updating...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditProfilePage;
