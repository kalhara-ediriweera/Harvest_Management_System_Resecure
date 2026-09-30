import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-toastify";

const OAuthCallback = () => {
  const { refreshSession } = useAuth();
  const navigate = useNavigate();
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const handleCallback = async () => {
      try {
        const user = await refreshSession();
        const role = user?.role;

        if (role === "admin") {
          navigate("/admin-finance", { replace: true });
          toast.success("Login successful! Welcome Admin.");
        } else if (role === "farmer") {
          navigate("/farmer-home", { replace: true });
          toast.success("Login successful! Welcome Farmer.");
        } else if (role === "buyer") {
          navigate("/shop", { replace: true });
          toast.success("Login successful! Welcome Buyer.");
        } else {
          navigate("/", { replace: true });
          toast.success("Login successful! Welcome.");
        }
      } catch (err) {
        navigate("/login?error=google_failed", { replace: true });
      }
    };

    handleCallback();
  }, [refreshSession, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-md border border-gray-200 text-center max-w-sm w-full">
        <div className="flex justify-center mb-4">
          <svg
            className="animate-spin h-8 w-8 text-green-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-1">
          Completing Sign In
        </h3>
        <p className="text-sm text-gray-500">
          Please wait while we verify your session...
        </p>
      </div>
    </div>
  );
};

export default OAuthCallback;
