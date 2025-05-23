// pages/register.tsx
"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";

const RegisterSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  phone_number: z.string().min(10),
  password: z.string().min(6),
});

const OtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().min(6).max(6),
});

type RegisterData = z.infer<typeof RegisterSchema>;
type OtpData = z.infer<typeof OtpSchema>;

export default function RegisterPage() {
  const [step, setStep] = useState<"form" | "otp">("form");
  const [email, setEmail] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterData>({ resolver: zodResolver(RegisterSchema) });

  const {
    register: otpRegister,
    handleSubmit: handleOtpSubmit,
    formState: { errors: otpErrors },
  } = useForm<OtpData>({ resolver: zodResolver(OtpSchema) });

  const onSubmit = async (data: RegisterData) => {
    try {
      await axios.post("http://127.0.0.1:8000/api/register/", data);
      setEmail(data.email);
      setStep("otp");
    } catch (error: any) {
      alert(error.response?.data?.error || "Registration failed");
    }
  };

  const onVerifyOtp = async (data: OtpData) => {
    try {
      await axios.post("http://127.0.0.1:8000/api/verify-otp/", data);
      alert("Account activated! You can now log in.");
      setStep("form");
    } catch (error: any) {
      alert(error.response?.data?.error || "OTP verification failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white p-6 rounded-xl shadow-lg">
        {step === "form" ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <h2 className="text-2xl font-bold text-center">Register</h2>
            <input
              {...register("username")}
              placeholder="Username"
              className="w-full p-2 border rounded"
            />
            {errors.username && <p className="text-red-500 text-sm">{errors.username.message}</p>}

            <input
              {...register("email")}
              placeholder="Email"
              className="w-full p-2 border rounded"
            />
            {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}

            <input
              {...register("phone_number")}
              placeholder="Phone Number"
              className="w-full p-2 border rounded"
            />
            {errors.phone_number && <p className="text-red-500 text-sm">{errors.phone_number.message}</p>}

            <input
              {...register("password")}
              type="password"
              placeholder="Password"
              className="w-full p-2 border rounded"
            />
            {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}

            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
              Register
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit(onVerifyOtp)} className="space-y-4">
            <h2 className="text-xl font-semibold text-center">Enter OTP</h2>
            <input
              {...otpRegister("email")}
              value={email}
              readOnly
              className="w-full p-2 border rounded bg-gray-100"
            />

            <input
              {...otpRegister("otp")}
              placeholder="Enter OTP"
              className="w-full p-2 border rounded"
            />
            {otpErrors.otp && <p className="text-red-500 text-sm">{otpErrors.otp.message}</p>}

            <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
              Verify OTP
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
