"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const RegisterSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email"),
  phone_number: z.string().min(10, "Phone number must be at least 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const OtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().min(6, "OTP must be 6 digits").max(6, "OTP must be 6 digits"),
});

type RegisterData = z.infer<typeof RegisterSchema>;
type OtpData = z.infer<typeof OtpSchema>;

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://refine-go.onrender.com/api';

export default function RegisterPage() {
  const [step, setStep] = useState<"form" | "otp">("form");
  const [email, setEmail] = useState("");
  const [isDark, setIsDark] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFormError,
  } = useForm<RegisterData>({ resolver: zodResolver(RegisterSchema) });

  const {
    register: otpRegister,
    handleSubmit: handleOtpSubmit,
    formState: { errors: otpErrors },
    setError: setOtpError,
  } = useForm<OtpData>({ resolver: zodResolver(OtpSchema) });

  // Get CSRF token on component mount
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

  const onSubmit = async (data: RegisterData) => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        setEmail(data.email);
        setStep("otp");
        setSuccess(result.message);
      } else {
        setError(result.error);
        // Set specific field errors if they exist
        if (result.error.includes('Username')) {
          setFormError('username', { message: result.error });
        } else if (result.error.includes('Email')) {
          setFormError('email', { message: result.error });
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError("Registration failed. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const onVerifyOtp = async (data: OtpData) => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/verify-otp/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({
          email: email,
          otp: data.otp,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(result.message);
        setTimeout(() => {
          // Redirect to dashboard or login page
          window.location.href = '/Dashboard';
        }, 2000);
      } else {
        setError(result.error);
        if (result.error.includes('Invalid')) {
          setOtpError('otp', { message: result.error });
        }
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setError("Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/resend-otp/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(result.message);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      setError("Failed to resend code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    alert(`Login with ${provider} - Integration needed`);
  };

  const toggleTheme = () => {
  const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle('dark');

    // Save to localStorage
    localStorage.setItem('isDark', newTheme.toString());
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode') === 'true';

    setIsDark(savedTheme);

    if (savedTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);



  return (
    <div className={`min-h-screen transition-all duration-300 ${isDark ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className={`border-b ${isDark ? 'border-gray-800 bg-black/50' : 'border-gray-200 bg-white/80'} backdrop-blur-xl sticky top-0 z-50 hidden md:block`}>
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-lg ${isDark ? 'bg-white' : 'bg-[#2edda2]'} flex items-center justify-center`}>
                <span className={`font-bold text-sm ${isDark ? 'text-black' : 'text-white'}`}>R</span>
              </div>
              <h1 className="text-xl font-bold bg-[#2edda2] bg-clip-text text-transparent">
                RefineGo
              </h1>
            </div>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
            >
              {isDark ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold mb-3">
            {step === "form" ? (
              <>
                Create{' '}
                <span className="bg-[#2edda2] bg-clip-text text-transparent">
                  your account
                </span>
              </>
            ) : (<>Check {""}
                <span className="bg-[#2edda2] bg-clip-text text-transparent font-semibold">your email</span></>
            )}
          </h2>

          <p className={`text-base ${isDark ? 'text-gray-400' : 'text-gray-600'} leading-relaxed`}>
            {step === "form" ? (
              <>
                Join{" "}
                <span className="bg-[#2edda2] bg-clip-text text-transparent font-medium">
                  thousands of drivers using RefineGo
                </span>{" "}
                to find nearby gas stations and{" "}
                <span className="bg-[#2edda2] bg-clip-text text-transparent font-medium">
                  get real-time directions
                </span>{" "}
              </>
            ) : (
              <>
                We sent a {" "}
                <span className="bg-[#2edda2] bg-clip-text text-transparent font-medium">
                  verification code</span> to <span className="bg-[#2edda2] bg-clip-text text-transparent font-medium">
                  {email}</span>
              </>
            )}
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-4 rounded-xl border border-gray-200 text-red-400 text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-4 rounded-xl border border-gray-200 text-gray-300 text-sm">
            {success}
          </div>
        )}

        {/* Main Card */}
        <div className={`${isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'} rounded-2xl border shadow-sm`}>
          <div className="p-8">
            {step === "form" ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Social Login */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => handleSocialLogin("Apple")}
                    className={`w-full flex items-center justify-center space-x-3 py-3 px-4 rounded-xl border transition-all ${
                      isDark
                        ? 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      x="0px"
                      y="0px"
                      width="20"
                      height="20"
                      viewBox="0 0 50 50"
                      className={`${isDark ? 'fill-white' : 'fill-black'}`}
                    >
                      <path d="M 33.375 0 C 30.539063 0.191406 27.503906 1.878906 25.625 4.15625 C 23.980469 6.160156 22.601563 9.101563 23.125 12.15625 C 22.65625 12.011719 22.230469 11.996094 21.71875 11.8125 C 20.324219 11.316406 18.730469 10.78125 16.75 10.78125 C 12.816406 10.78125 8.789063 13.121094 6.25 17.03125 C 2.554688 22.710938 3.296875 32.707031 8.90625 41.25 C 9.894531 42.75 11.046875 44.386719 12.46875 45.6875 C 13.890625 46.988281 15.609375 47.980469 17.625 48 C 19.347656 48.019531 20.546875 47.445313 21.625 46.96875 C 22.703125 46.492188 23.707031 46.070313 25.59375 46.0625 C 25.605469 46.0625 25.613281 46.0625 25.625 46.0625 C 27.503906 46.046875 28.476563 46.460938 29.53125 46.9375 C 30.585938 47.414063 31.773438 48.015625 33.5 48 C 35.554688 47.984375 37.300781 46.859375 38.75 45.46875 C 40.199219 44.078125 41.390625 42.371094 42.375 40.875 C 43.785156 38.726563 44.351563 37.554688 45.4375 35.15625 C 45.550781 34.90625 45.554688 34.617188 45.445313 34.363281 C 45.339844 34.109375 45.132813 33.910156 44.875 33.8125 C 41.320313 32.46875 39.292969 29.324219 39 26 C 38.707031 22.675781 40.113281 19.253906 43.65625 17.3125 C 43.917969 17.171875 44.101563 16.925781 44.164063 16.636719 C 44.222656 16.347656 44.152344 16.042969 43.96875 15.8125 C 41.425781 12.652344 37.847656 10.78125 34.34375 10.78125 C 32.109375 10.78125 30.46875 11.308594 29.125 11.8125 C 28.902344 11.898438 28.738281 11.890625 28.53125 11.96875 C 29.894531 11.25 31.097656 10.253906 32 9.09375 C 33.640625 6.988281 34.90625 3.992188 34.4375 0.84375 C 34.359375 0.328125 33.894531 -0.0390625 33.375 0 Z M 32.3125 2.375 C 32.246094 4.394531 31.554688 6.371094 30.40625 7.84375 C 29.203125 9.390625 27.179688 10.460938 25.21875 10.78125 C 25.253906 8.839844 26.019531 6.828125 27.1875 5.40625 C 28.414063 3.921875 30.445313 2.851563 32.3125 2.375 Z M 16.75 12.78125 C 18.363281 12.78125 19.65625 13.199219 21.03125 13.6875 C 22.40625 14.175781 23.855469 14.75 25.5625 14.75 C 27.230469 14.75 28.550781 14.171875 29.84375 13.6875 C 31.136719 13.203125 32.425781 12.78125 34.34375 12.78125 C 36.847656 12.78125 39.554688 14.082031 41.6875 16.34375 C 38.273438 18.753906 36.675781 22.511719 37 26.15625 C 37.324219 29.839844 39.542969 33.335938 43.1875 35.15625 C 42.398438 36.875 41.878906 38.011719 40.71875 39.78125 C 39.761719 41.238281 38.625 42.832031 37.375 44.03125 C 36.125 45.230469 34.800781 45.988281 33.46875 46 C 32.183594 46.011719 31.453125 45.628906 30.34375 45.125 C 29.234375 44.621094 27.800781 44.042969 25.59375 44.0625 C 23.390625 44.074219 21.9375 44.628906 20.8125 45.125 C 19.6875 45.621094 18.949219 46.011719 17.65625 46 C 16.289063 45.988281 15.019531 45.324219 13.8125 44.21875 C 12.605469 43.113281 11.515625 41.605469 10.5625 40.15625 C 5.3125 32.15625 4.890625 22.757813 7.90625 18.125 C 10.117188 14.722656 13.628906 12.78125 16.75 12.78125 Z"></path>
                    </svg>
                    <span className="font-medium">Continue with Apple</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSocialLogin("Google")}
                    className={`w-full flex items-center justify-center space-x-3 py-3 px-4 rounded-xl border transition-all ${
                      isDark
                        ? 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    <img
                      src={
                        isDark
                          ? "https://img.icons8.com/?size=100&id=17904&format=png&color=ffffff"
                          : "https://img.icons8.com/?size=100&id=17904&format=png&color=000000"
                      }
                      alt="Google icon"
                      className="w-5 h-5"
                    />
                    <span className="font-medium">Continue with Google</span>
                  </button>
                </div>

                                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className={`w-full border-t ${isDark ? 'border-gray-700' : 'border-gray-300'}`}></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className={`px-4 ${isDark ? 'bg-gray-900/50 text-gray-400' : 'bg-white text-gray-500'}`}>or</span>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <input
                      {...register("username")}
                      placeholder="Username"
                      className={`w-full px-4 py-3 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-[#2edda2] ${
                        isDark 
                          ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                    {errors.username && (
                      <p className="mt-1 text-sm text-red-500">{errors.username.message}</p>
                    )}
                  </div>

                  <div>
                    <input
                      {...register("email")}
                      type="email"
                      placeholder="Email"
                      className={`w-full px-4 py-3 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-[#2edda2] ${
                        isDark 
                          ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <input
                      {...register("phone_number")}
                      placeholder="Phone number"
                      className={`w-full px-4 py-3 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-[#2edda2] ${
                        isDark 
                          ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                    {errors.phone_number && (
                      <p className="mt-1 text-sm text-red-500">{errors.phone_number.message}</p>
                    )}
                  </div>

                  <div>
                    <input
                      {...register("password")}
                      type="password"
                      placeholder="Password"
                      className={`w-full px-4 py-3 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-[#2edda2] ${
                        isDark 
                          ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full font-medium py-3 px-4 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-[#2edda2] focus:ring-offset-2 ${
                    isLoading 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-[#2edda2] hover:bg-[#25c993] text-white'
                  }`}
                >
                  {isLoading ? 'Creating Account...' : 'Continue'}
                </button>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                    isDark ? 'bg-gray-800' : 'bg-gray-100'
                  }`}>
                    <svg className="w-8 h-8 text-[#2edda2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>

                <form onSubmit={handleOtpSubmit(onVerifyOtp)} className="space-y-4">
                  <input
                    {...otpRegister("email")}
                    value={email}
                    readOnly
                    className={`w-full px-4 py-3 text-center rounded-xl border ${
                      isDark 
                        ? 'bg-gray-800 border-gray-700 text-gray-400' 
                        : 'bg-gray-100 border-gray-300 text-gray-600'
                    }`}
                  />

                  <input
                    {...otpRegister("otp")}
                    placeholder="Enter verification code"
                    className={`w-full px-4 py-3 rounded-xl border text-center tracking-wider transition-all focus:outline-none focus:ring-2 focus:ring-[#25c993] ${
                      isDark 
                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    maxLength={6}
                  />
                  {otpErrors.otp && (
                    <p className="text-sm text-red-500 text-center">{otpErrors.otp.message}</p>
                  )}

                  <div className="space-y-3">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`w-full font-medium py-3 px-4 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-[#25c993] focus:ring-offset-2 ${
                        isLoading 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-[#2edda2] hover:bg-[#25c993] text-white'
                      }`}
                    >
                      {isLoading ? 'Verifying...' : 'Verify email'}
                    </button>

                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setStep("form")}
                        className={`flex-1 font-medium py-3 px-4 rounded-xl transition-colors ${
                          isDark 
                            ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        Back
                      </button>

                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={isLoading}
                        className={`flex-1 font-medium py-3 px-4 rounded-xl transition-colors border ${
                          isLoading
                            ? 'cursor-not-allowed opacity-50'
                            : isDark 
                              ? 'border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600' 
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                        }`}
                      >
                        {isLoading ? 'Sending...' : 'Resend Code'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Already have an account?{' '}
            <a href="/Login" className="text-[#2edda2] hover:text-[#25c993] font-medium">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
    );
  }
