"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Validation schemas
const EmailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const OtpSchema = z.object({
  otp: z.string().min(6, "Code must be 6 digits").max(6, "Code must be 6 digits"),
});

const ResetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type EmailData = z.infer<typeof EmailSchema>;
type OtpData = z.infer<typeof OtpSchema>;
type ResetPasswordData = z.infer<typeof ResetPasswordSchema>;

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "otp" | "reset">("email");
  const [email, setEmail] = useState("");
  const [isDark, setIsDark] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");

  // Form hooks
  const emailForm = useForm<EmailData>({ 
    resolver: zodResolver(EmailSchema),
    defaultValues: { email: "" }
  });

  const otpForm = useForm<OtpData>({ 
    resolver: zodResolver(OtpSchema),
    defaultValues: { otp: "" }
  });

  const resetForm = useForm<ResetPasswordData>({ 
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" }
  });

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode') === 'true';

    setIsDark(savedTheme);

    if (savedTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Utility functions
  const getCsrfToken = async (): Promise<string | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/csrf-token/`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch CSRF token');
      const data = await response.json();
      return data.csrfToken;
    } catch (error) {
      console.error('CSRF token error:', error);
      return null;
    }
  };

  const makeApiRequest = async (endpoint: string, body: any) => {
    const csrfToken = await getCsrfToken();
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken || '',
      },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  };

  // Step handlers
  const onSendResetCode = async (data: EmailData) => {
    setIsLoading(true);
    setSuccessMessage("");
    emailForm.clearErrors();

    try {
      const result = await makeApiRequest('/api/auth/user-forgot-password/', data);
      
      if (result.success) {
        setEmail(data.email);
        setStep("otp");
        setCountdown(60);
        setSuccessMessage("Reset code sent successfully!");
      } else {
        emailForm.setError("root", { 
          message: result.error || "Failed to send reset code. Please try again." 
        });
      }
    } catch (error) {
      console.error('Send reset code error:', error);
      emailForm.setError("root", { 
        message: "Unable to send reset code. Please check your connection and try again." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onVerifyOtp = async (data: OtpData) => {
    setIsLoading(true);
    setSuccessMessage("");
    otpForm.clearErrors();

    try {
      const result = await makeApiRequest('/api/auth/verify-reset-otp/', {
        email: email,
        otp: data.otp,
      });

      if (result.success) {
        setStep("reset");
        setSuccessMessage("Code verified successfully!");
      } else {
        otpForm.setError("otp", { 
          message: result.error || "Invalid or expired code. Please try again." 
        });
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      otpForm.setError("otp", { 
        message: "Verification failed. Please try again." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onResetPassword = async (data: ResetPasswordData) => {
    setIsLoading(true);
    setSuccessMessage("");
    resetForm.clearErrors();

    try {
      const result = await makeApiRequest('/api/auth/reset-password/', {
        email: email,
        password: data.password,
      });

      if (result.success) {
        setSuccessMessage("Password updated successfully! Redirecting to login...");
        setTimeout(() => {
          window.location.href = '/Login';
        }, 2000);
      } else {
        resetForm.setError("root", { 
          message: result.error || "Failed to update password. Please try again." 
        });
      }
    } catch (error) {
      console.error('Reset password error:', error);
      resetForm.setError("root", { 
        message: "Password reset failed. Please try again." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0 || !email) return;
    
    setIsLoading(true);
    try {
      const result = await makeApiRequest('/api/auth/forgot-password/', { email });
      if (result.success) {
        setCountdown(60);
        setSuccessMessage("New code sent!");
      }
    } catch (error) {
      console.error('Resend code error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle('dark', newTheme);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('isDark', newTheme.toString());
    }
  };

  // Step content configuration
  const getStepContent = () => {
    const steps = {
      email: {
        title: (
          <>
            <span className="bg-[#2edda2] bg-clip-text text-transparent">Forgot</span> your password?
          </>
        ),
        subtitle: (
          <>
            No worries! Enter your <span className="bg-[#2edda2] bg-clip-text text-transparent">email address</span> and we'll send you a reset code
          </>
        ),
        icon: (
          <svg className="w-8 h-8 text-[#2edda2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9a2 2 0 012-2m0 0V7a2 2 0 012-2m-2 2H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V9a2 2 0 00-2-2z" />
          </svg>
        )
      },
      otp: {
        title: (
          <>
            Check <span className="bg-[#2edda2] bg-clip-text text-transparent">your email</span>
          </>
        ),
        subtitle: (
          <>
            We sent a <span className="bg-[#2edda2] bg-clip-text text-transparent">6-digit code</span> to {email}
          </>
        ),
        icon: (
          <svg className="w-8 h-8 text-[#2edda2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        )
      },
      reset: {
        title: (
          <>
            Create <span className="bg-[#2edda2] bg-clip-text text-transparent">new password</span>
          </>
        ),
        subtitle: (
          <>
            Choose a <span className="bg-[#2edda2] bg-clip-text text-transparent">strong password</span> to secure your account
          </>
        ),
        icon: (
          <svg className="w-8 h-8 text-[#2edda2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        )
      }
    };
    
    return steps[step];
  };

  const stepContent = getStepContent();
  const stepIndex = step === "email" ? 0 : step === "otp" ? 1 : 2;

  return (
    <div className={`min-h-screen transition-all duration-300 ${isDark ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className={`border-b ${isDark ? 'border-gray-800 bg-black/50' : 'border-gray-200 bg-white/80'} backdrop-blur-xl sticky top-0 z-50 hidden md:block `}>
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => window.history.back()}
                className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className={`w-8 h-8 rounded-lg ${isDark ? 'bg-white' : 'bg-[#2edda2]'} flex items-center justify-center`}>
                <span className={`font-bold text-sm ${isDark ? 'text-black' : 'text-white'}`}>R</span>
              </div>
              <h1 className="text-xl font-bold bg-[#2edda2] bg-clip-text text-transparent">
                RefineGo
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6 ${
            isDark ? 'bg-gray-900/50 border border-gray-800' : 'bg-white border border-gray-200'
          } shadow-sm`}>
            {stepContent.icon}
          </div>
          
          <h2 className="text-3xl font-semibold mb-3">
            {stepContent.title}
          </h2>

          <p className={`text-base ${isDark ? 'text-gray-400' : 'text-gray-600'} leading-relaxed`}>
            {stepContent.subtitle}
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm text-center">{successMessage}</p>
          </div>
        )}

        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-2 w-8 rounded-full transition-all duration-300 ${
                  i <= stepIndex
                    ? 'bg-[#2edda2]'
                    : isDark 
                      ? 'bg-gray-800' 
                      : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Main Card */}
        <div className={`${isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'} rounded-2xl border shadow-sm`}>
          <div className="p-8">
            {/* Email Step */}
            {step === "email" && (
              <form onSubmit={emailForm.handleSubmit(onSendResetCode)} className="space-y-6">
                <div>
                  <input
                    {...emailForm.register("email")}
                    type="email"
                    placeholder="Enter your email address"
                    className={`w-full px-4 py-3 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-[#25c993] focus:border-transparent ${
                      isDark 
                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    disabled={isLoading}
                  />
                  {emailForm.formState.errors.email && (
                    <p className="mt-2 text-sm text-red-500">{emailForm.formState.errors.email.message}</p>
                  )}
                  {emailForm.formState.errors.root && (
                    <p className="mt-2 text-sm text-red-500">{emailForm.formState.errors.root.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#2edda2] hover:bg-[#25c993] text-white font-medium py-3 px-4 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#25c993] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending...</span>
                    </div>
                  ) : (
                    "Send reset code"
                  )}
                </button>
              </form>
            )}

            {/* OTP Step */}
            {step === "otp" && (
              <form onSubmit={otpForm.handleSubmit(onVerifyOtp)} className="space-y-6">
                <div className="space-y-4">
                  <div className={`px-4 py-3 rounded-xl border text-center ${
                    isDark 
                      ? 'bg-gray-800 border-gray-700 text-gray-400' 
                      : 'bg-gray-100 border-gray-300 text-gray-600'
                  }`}>
                    {email}
                  </div>

                  <div>
                    <input
                      {...otpForm.register("otp")}
                      placeholder="Enter 6-digit code"
                      className={`w-full px-4 py-3 rounded-xl border text-center tracking-widest text-m  transition-all focus:outline-none focus:ring-2 focus:ring-[#25c993] focus:border-transparent ${
                        isDark 
                          ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      maxLength={6}
                      disabled={isLoading}
                    />
                    {otpForm.formState.errors.otp && (
                      <p className="mt-2 text-sm text-red-500 text-center">{otpForm.formState.errors.otp.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#2edda2] hover:bg-[#25c993] text-white font-medium py-3 px-4 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#25c993] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Verifying...</span>
                      </div>
                    ) : (
                      "Verify code"
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep("email")}
                    className={`w-full font-medium py-3 px-4 rounded-xl transition-colors ${
                      isDark 
                        ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Change email
                  </button>
                </div>

                {/* Resend Code */}
                <div className="text-center">
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Didn't receive the code?{' '}
                    <button 
                      type="button"
                      onClick={handleResendCode} 
                      disabled={countdown > 0 || isLoading}
                      className="text-[#2edda2] hover:text-[#25c993] font-medium disabled:text-gray-500 disabled:cursor-not-allowed"
                    >
                      {countdown > 0 ? `Resend in ${countdown}s` : 'Resend'}
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* Reset Password Step */}
            {step === "reset" && (
              <form onSubmit={resetForm.handleSubmit(onResetPassword)} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <input
                      {...resetForm.register("password")}
                      type="password"
                      placeholder="New password"
                      className={`w-full px-4 py-3 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-[#25c993] focus:border-transparent ${
                        isDark 
                          ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      disabled={isLoading}
                    />
                    {resetForm.formState.errors.password && (
                      <p className="mt-2 text-sm text-red-500">{resetForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div>
                    <input
                      {...resetForm.register("confirmPassword")}
                      type="password"
                      placeholder="Confirm new password"
                      className={`w-full px-4 py-3 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-[#25c993] focus:border-transparent ${
                        isDark 
                          ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      disabled={isLoading}
                    />
                    {resetForm.formState.errors.confirmPassword && (
                      <p className="mt-2 text-sm text-red-500">{resetForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>

                {resetForm.formState.errors.root && (
                  <p className="text-sm text-red-500 text-center">{resetForm.formState.errors.root.message}</p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#2edda2] hover:bg-[#25c993] text-white font-medium py-3 px-4 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#25c993] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Updating...</span>
                    </div>
                  ) : (
                    "Update password"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Remember your password?{' '}
            <a href="/Login" className="text-[#2edda2] hover:text-[#25c993] font-medium">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}