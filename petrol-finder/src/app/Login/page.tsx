// pages/login.tsx
"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useRouter } from "next/navigation";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const OtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().min(6).max(6),
});

type LoginData = z.infer<typeof LoginSchema>;
type OtpData = z.infer<typeof OtpSchema>;

export default function LoginPage() {
  const [step, setStep] = useState<"form" | "otp">("form");
  const [email, setEmail] = useState("");
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>({ resolver: zodResolver(LoginSchema) });

  const {
    register: otpRegister,
    handleSubmit: handleOtpSubmit,
    formState: { errors: otpErrors },
  } = useForm<OtpData>({ resolver: zodResolver(OtpSchema) });

  const onSubmit = async (data: LoginData) => {
    try {
      await axios.post("http://127.0.0.1:8000/api/login/", data);
      setEmail(data.email);
      setStep("otp");
    } catch (error: any) {
      alert(error.response?.data?.error || "Login failed");
    }
  };

  const onVerifyOtp = async (data: OtpData) => {
    try {
      const response = await axios.post("http://127.0.0.1:8000/api/login-verify-otp/", data);
      const { token } = response.data as { token: string };
      localStorage.setItem("token", token);
      alert("Login successful");
      router.push("/dashboard");
    } catch (error: any) {
      alert(error.response?.data?.error || "OTP verification failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white p-6 rounded-xl shadow-lg">
        {step === "form" ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <h2 className="text-2xl font-bold text-center">Login</h2>

            <input
              {...register("email")}
              placeholder="Email"
              className="w-full p-2 border rounded"
            />
            {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}

            <input
              {...register("password")}
              type="password"
              placeholder="Password"
              className="w-full p-2 border rounded"
            />
            {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}

            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
              Login
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit(onVerifyOtp)} className="space-y-4">
            <h2 className="text-xl font-semibold text-center">Verify OTP</h2>
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
              Confirm OTP
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
