import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import logo from "../assets/logo.png";


export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resetToken, setResetToken] = useState("");

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send reset link");
      }

      setSuccess(true);
      setResetToken(data.resetToken);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------
  // SUCCESS SCREEN
  // ----------------------------------------------

  if (success) {
    return (
      <div className="min-h-screen content-offset">
        <Navbar />
        <div className="min-h-screen content-offset flex items-center justify-center p-4 premium-bg">
          <div className="premium-card-glow p-8 w-full max-w-md animate-fade-scale">
            <div className="text-center">

              {/* SUCCESS ICON */}
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>

              <h2 className="custom-heading mb-4" style={{ color: '#1f2937' }}>
                Check Your Email
              </h2>

              <p className="text-gray-600 mb-6">
                A password reset link has been sent to <strong>{email}</strong>
              </p>

              {/* BACK TO LOGIN */}
              <Link
                to="/login"
                className="w-full px-6 py-4 curved-xl glow-btn text-white font-semibold transition inline-block text-center"
                style={{ backgroundColor: '#14b8a6' }}
              >
                Back to Login
              </Link>

            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ----------------------------------------------
  // FORM SCREEN
  // ----------------------------------------------

  return (
    <div className="min-h-screen content-offset">
      <Navbar />
      <div className="min-h-screen content-offset flex items-center justify-center p-4 premium-bg">
        <div className="premium-card-glow p-8 w-full max-w-md animate-fade-scale">

          {/* LOGO + TITLE */}
          <div className="text-center mb-8">
            <Link to="/" className="flex flex-col items-center mb-3">
              <img src={logo} className="w-20 mb-2 animate-float" alt="logo" />
            </Link>

            <h1 className="custom-heading" style={{ color: '#1f2937' }}>
              Forgot Password?
            </h1>
            <p className="text-gray-600 text-sm mt-2">
              Enter your email to receive a reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* INPUT */}
            <div className="animate-fade-slide stagger-1" style={{ opacity: 0, animationFillMode: 'forwards' }}>
              <label className="block text-gray-700 mb-2 font-medium">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="w-full px-4 py-3 glow-input transition"
                style={{ color: '#1f2937' }}
              />
            </div>

            {/* BUTTON */}
            <div className="animate-fade-slide stagger-2" style={{ opacity: 0, animationFillMode: 'forwards' }}>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 curved-xl glow-btn text-white font-semibold transition"
                style={{ backgroundColor: '#14b8a6' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Sending...
                  </span>
                ) : 'Send Reset Link'}
              </button>
            </div>

            {/* BACK TO LOGIN */}
            <div className="text-center mt-2 animate-fade-slide stagger-3" style={{ opacity: 0, animationFillMode: 'forwards' }}>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-teal-600 transition font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </div>

          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}
