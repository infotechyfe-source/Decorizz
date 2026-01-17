import React, { useState, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'sonner';
import logo from "../assets/logo.png";
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, googleLogin } = useContext(AuthContext);
  const location = useLocation();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const update = (e: any) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const submit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      toast.success('Login Successful!');
      const redirect = (location.state as any)?.redirect || localStorage.getItem('redirectAfterLogin') || '/';
      localStorage.removeItem('redirectAfterLogin');
      navigate(redirect, { replace: true });
    } catch (err: any) {
      toast.error('Invalid Email or Password');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const state = location.state as any;
    if (state?.redirect) {
      localStorage.setItem('redirectAfterLogin', state.redirect);
    }
  }, [location.state]);

  return (
    <div className="min-h-screen content-offset">
      <Navbar />
      <div className="min-h-screen content-offset flex items-center justify-center p-4 premium-bg">
        <div className="premium-card-glow p-8 w-full max-w-md animate-fade-scale ">

          {/* LOGO + BRAND */}
          <div className="text-center mb-8">
            <Link to="/" className="flex flex-col items-center mb-3">
              <img src={logo} className="w-20 mb-2 animate-float" alt="logo" />
            </Link>

            <h1 className="custom-heading text-2xl font-semibold tracking-tight bg-linear-to-br from-green-400 to-green-500 bg-clip-text">
              Sign in to your account
            </h1>

          </div>

          {/* FORM */}
          <form onSubmit={submit} className="space-y-6">

            {/* EMAIL */}
            <div className="animate-fade-slide stagger-1" style={{ opacity: 0, animationFillMode: 'forwards' }}>
              <label className="block text-gray-700 mb-2 font-medium">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={update}
                required
                className="w-full px-4 py-3 glow-input transition"
                style={{ color: '#1f2937' }}
                placeholder="user@example.com"
              />
            </div>

            {/* PASSWORD */}
            <div className="animate-fade-slide stagger-2" style={{ opacity: 0, animationFillMode: 'forwards' }}>
              <div className="flex justify-between items-center mb-2">
                <label className="text-gray-700 font-medium">Password</label>
                <Link to="/forgot-password" className="text-sm font-medium hover-glow curved-sm px-2 py-1 transition" style={{ color: '#14b8a6' }}>
                  Forgot Password?
                </Link>
              </div>
              <div className="glow-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={update}
                  required
                  className="glow-input-field"
                  style={{ color: '#1f2937' }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                  className="password-toggle"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* LOGIN BUTTON */}
            <div className="animate-fade-slide stagger-3" style={{ opacity: 0, animationFillMode: 'forwards' }}>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 curved-xl glow-btn text-white font-semibold transition"
                style={{ backgroundColor: '#14b8a6' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </button>
            </div>
          </form>

          {/* FOOTER LINKS */}
          <div className="mt-6 text-center animate-fade-slide stagger-4" style={{ opacity: 0, animationFillMode: 'forwards' }}>
            <p className="text-gray-600">
              Don&apos;t have an account?{' '}
              <Link
                to="/signup"
                className="font-medium hover:underline text-gradient-teal"
              >
                Create one
              </Link>
            </p>
          </div>

        </div>
      </div>
      <Footer />
    </div>
  );
}
