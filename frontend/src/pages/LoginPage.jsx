import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { api } from "../lib/api";

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

export default function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation(); // Additional safeguard

    // Always clear errors first for a clean state
    setError(null);

    if (!form.email.trim() || !form.password) {
      const errorMsg = "Please enter your email and password.";
      setError(errorMsg);
      return;
    }
    if (!isValidEmail(form.email)) {
      const errorMsg = "Please enter a valid email address.";
      setError(errorMsg);
      return;
    }

    setSubmitting(true);

    api.post("/api/auth/login", {
      email: form.email.trim(),
      password: form.password,
    }, {
      skipAuthRedirect: true // Add this config to prevent interceptor redirect on 401
    })
      .then((res) => {

        // Handle non-200 status or missing token (invalid creds)
        if (res.status !== 200 || !res.data?.token) {
          const errorMsg = "Incorrect email or password.";
          setError(errorMsg);
          return;
        }

        localStorage.setItem("auth_token", res.data.token);

        return api.get("/api/auth/me").then((meRes) => {

          // Handle non-200 status for session verification
          if (meRes.status !== 200) {
            const errorMsg = "Login failed. Please try again.";
            setError(errorMsg);
            localStorage.removeItem("auth_token");
            return;
          }

          navigate("/dashboard", { replace: true });
        });
      })
      .catch((err) => {
        const status = err?.response?.status;
        let errorMsg;
        if (status === 401) {
          errorMsg = "Incorrect email or password.";
        } else {
          errorMsg = err?.response?.data?.message || "Login failed. Please try again.";
        }
        setError(errorMsg);
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <style jsx>{`
        :root {
          /* Neural Network Animation Vars (Pure CSS AI effect) */
          --inputX: 0.9;
          --inputY: -1;
          --output1bias: 0.006412765611663633;
          --output2bias: 0.007072853542676219;
          --output3bias: 0.0064746685639952214;
          --output4bias: 0.004851470988693036;
          --weights1-1: -0.9807254999119579;
          --weights1-2: 0.9813663133332142;
          --weights1-3: -0.9817224902785696;
          --weights1-4: 0.9817919593383302;
          --weights2-1: -0.9809082670731147;
          --weights2-2: -0.9816176935504328;
          --weights2-3: 0.9815336794202348;
          --weights2-4: 0.9815925299039976;
          --output1a: calc((var(--weights1-1) * var(--inputX)) + (var(--weights2-1) * var(--inputY)));
          --output2a: calc((var(--weights1-2) * var(--inputX)) + (var(--weights2-2) * var(--inputY)));
          --output3a: calc((var(--weights1-3) * var(--inputX)) + (var(--weights2-3) * var(--inputY)));
          --output4a: calc((var(--weights1-4) * var(--inputX)) + (var(--weights2-4) * var(--inputY)));
          --output1b: calc(max(0, var(--output1a)) + var(--output1bias));
          --output2b: calc(max(0, var(--output2a)) + var(--output2bias));
          --output3b: calc(max(0, var(--output3a)) + var(--output3bias));
          --output4b: calc(max(0, var(--output4a)) + var(--output4bias));
          --maxOut: max(var(--output1b), var(--output2b), var(--output3b), var(--output4b));
          --output1c: max(calc(1 - ((var(--output1b) - var(--maxOut)) * (var(--output1b) - var(--maxOut)) * 1000000000)), 0);
          --output2c: max(calc(1 - ((var(--output2b) - var(--maxOut)) * (var(--output2b) - var(--maxOut)) * 1000000000)), 0);
          --output3c: max(calc(1 - ((var(--output3b) - var(--maxOut)) * (var(--output3b) - var(--maxOut)) * 1000000000)), 0);
          --output4c: max(calc(1 - ((var(--output4b) - var(--maxOut)) * (var(--output4b) - var(--maxOut)) * 1000000000)), 0);
        }

        .neural-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background: 
            radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.3) 0%, transparent 50%);
          animation: neural-pulse 4s ease-in-out infinite alternate;
        }

        @keyframes neural-pulse {
          0% { opacity: 0.6; transform: scale(1); }
          100% { opacity: 0.8; transform: scale(1.02); }
        }

        .neural-node {
          position: absolute;
          width: 8px;
          height: 8px;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 50%;
          animation: float 6s ease-in-out infinite;
        }

        .neural-node:nth-child(1) { top: 20%; left: 30%; animation-delay: 0s; }
        .neural-node:nth-child(2) { top: 60%; left: 70%; animation-delay: 2s; }
        .neural-node:nth-child(3) { top: 80%; left: 20%; animation-delay: 4s; }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(180deg); }
        }

        .neural-line {
          position: absolute;
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.2), transparent);
          animation: line-glow 3s ease-in-out infinite;
        }

        .neural-line:nth-child(4) { top: 30%; left: 20%; width: 60%; animation-delay: 1s; }
        .neural-line:nth-child(5) { top: 50%; left: 60%; width: 30%; transform: rotate(45deg); animation-delay: 2.5s; }

        @keyframes line-glow {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.5; }
        }
      `}</style>

      <div className="max-w-6xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex lg:flex-row flex-col">
        {/* LEFT: White Login Side */}
        <div className="flex-1 lg:min-h-[600px] p-8 lg:p-12 flex flex-col justify-center">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-gray-900 mb-2">AIDEN</h1>
            <p className="text-xl text-gray-600 max-w-md mx-auto">
              Agentic Intelligence Dual-use Evaluation Network
            </p>
          </div>

          <div className="max-w-md mx-auto w-full space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-2xl text-sm text-red-700 animate-fade-in">
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email address
                </label>
                <input
                  id="email"
                  type="text"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                  className="w-full rounded-2xl border border-gray-200 px-5 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <a href="#" className="text-sm font-medium text-purple-600 hover:text-purple-700">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                    className="w-full rounded-2xl border border-gray-200 px-5 py-3.5 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                disabled={submitting}
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-800 disabled:from-blue-400 disabled:via-purple-400 disabled:to-indigo-500 text-white font-semibold py-3.5 rounded-2xl transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            <div className="text-center text-sm">
              <p className="text-gray-500">
                New organisation?{" "}
                <a href="/setup" className="font-medium text-purple-600 hover:text-purple-700 hover:underline">
                  Setup organisation
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT: Colored Animation Side */}
        <div className="flex-1 relative bg-gradient-to-br from-blue-200 via-purple-200 to-indigo-200 lg:min-h-[600px]">
          {/* Neural Network Background Animation */}
          <div className="neural-bg">
            {/* Simulated nodes (glowing dots) */}
            <div className="neural-node"></div>
            <div className="neural-node"></div>
            <div className="neural-node"></div>
            {/* Connecting lines */}
            <div className="neural-line"></div>
            <div className="neural-line"></div>
          </div>
          {/* Centered Image on Top */}
          <img
            src="/blank_logo.png"
            alt="AIDEN Illustration"
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 invisible lg:visible w-48 h-48 lg:w-80 lg:h-80 object-contain z-10 drop-shadow-lg"
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}