import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Lock, CheckCircle, AlertCircle } from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [email, setEmail] = useState("");

  // VERIFY TOKEN
  useEffect(() => {
    if (!token) {
      setError("Invalid reset link");
      setVerifying(false);
      return;
    }
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/auth/verify-reset-token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ token }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid or expired reset link");
        setTokenValid(false);
      } else {
        setTokenValid(true);
        setEmail(data.email);
      }
    } catch {
      setError("Failed to verify reset link");
      setTokenValid(false);
    } finally {
      setVerifying(false);
    }
  };

  // RESET PASSWORD
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ token, newPassword }),
        }
      );

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to reset password");

      setSuccess(true);

      // Auto redirect in 3 seconds
      setTimeout(() => navigate("/login"), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
  // LOADING STATE — VERIFICATION
  // ---------------------------------------------------------
  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #fdf9efff 0%, #f0fdf9 100%)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // INVALID TOKEN
  // ---------------------------------------------------------
  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #fdf9efff 0%, #f0fdf9 100%)' }}>
        <div className="max-w-md w-full bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/50 text-center">

          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>

          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Invalid Reset Link
          </h2>

          <p className="text-gray-600 mb-6">{error}</p>

          <Link
            to="/forgot-password"
            className="inline-block bg-[var(--primary)] text-white px-6 py-3 rounded-xl hover:opacity-90 transition"
          >
            Request New Link
          </Link>

        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // SUCCESS STATE
  // ---------------------------------------------------------
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #fdf9efff 0%, #f0fdf9 100%)' }}>
        <div className="max-w-md w-full bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/50 text-center">

          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>

          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Password Reset Successful
          </h2>

          <p className="text-gray-600 mb-6">
            Redirecting to login...
          </p>

        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // RESET PASSWORD FORM
  // ---------------------------------------------------------
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #fdf9efff 0%, #f0fdf9 100%)' }}>

      <div className="max-w-md w-full bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/50">

        <div className="text-center mb-8">

          <div className="mx-auto w-16 h-16 bg-[var(--primary)]/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-[var(--primary)]" />
          </div>

          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Reset Password
          </h1>

          <p className="text-gray-600">
            Set a new password for <strong>{email}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-gray-700 mb-2">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 
                focus:ring-[var(--primary)] transition"
              placeholder="Enter new password"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 
                focus:ring-[var(--primary)] transition"
              placeholder="Confirm new password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-medium transition disabled:opacity-50"
            style={{ backgroundColor: loading ? "#94a3b8" : "var(--primary)" }}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>

        </form>
      </div>
    </div>
  );
}
