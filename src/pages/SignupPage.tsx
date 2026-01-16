import React, { useState, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'sonner';
import logo from "../assets/logo.png";
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup, googleLogin } = useContext(AuthContext);
  const location = useLocation();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const update = (e: any) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const submit = async (e: any) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await signup(formData.email, formData.password, formData.name);
      toast.success('Account created successfully!');
      const redirect = (location.state as any)?.redirect || localStorage.getItem('redirectAfterLogin') || '/';
      localStorage.removeItem('redirectAfterLogin');
      navigate(redirect, { replace: true });
    } catch (error: any) {
      toast.error(error.message || 'Signup failed');
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
        <div className="premium-card-glow p-6 w-full max-w-md animate-fade-scale">

          {/* LOGO */}
          <div className="text-center mb-8">
            <Link to="/" className="flex flex-col items-center mb-3">
              <img src={logo} className="w-20 mb-2 animate-float" alt="logo" />
            </Link>

            <h1 className="custom-heading" style={{ color: '#1f2937' }}>
              Create your account
            </h1>
          </div>

          {/* FORM */}
          <form onSubmit={submit} className="space-y-5">

            {/* FULL NAME */}
            <div className="animate-fade-slide stagger-1" style={{ opacity: 0, animationFillMode: 'forwards' }}>
              <label className="block text-gray-700 mb-2 font-medium">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={update}
                required
                className="w-full px-4 py-3 glow-input transition"
                style={{ color: '#1f2937' }}
                placeholder="John Doe"
              />
            </div>

            {/* EMAIL */}
            <div className="animate-fade-slide stagger-2" style={{ opacity: 0, animationFillMode: 'forwards' }}>
              <label className="block text-gray-700 mb-2 mt-4 font-medium">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={update}
                required
                className="w-full px-4 py-3 glow-input transition"
                style={{ color: '#1f2937' }}
                placeholder="you@example.com"
              />
            </div>

            {/* PASSWORD */}
            <div className="animate-fade-slide stagger-3" style={{ opacity: 0, animationFillMode: 'forwards' }}>
              <label className="block text-gray-700 mb-2 mt-4 font-medium">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={update}
                required
                className="w-full px-4 py-3 glow-input transition"
                style={{ color: '#1f2937' }}
                placeholder="••••••••"
              />
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="animate-fade-slide stagger-4" style={{ opacity: 0, animationFillMode: 'forwards' }}>
              <label className="block text-gray-700 mb-2 mt-4 font-medium">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={update}
                required
                className="w-full px-4 py-3 mb-6 glow-input transition"
                style={{ color: '#1f2937' }}
                placeholder="••••••••"
              />
            </div>

            {/* BUTTON */}
            <div className="animate-fade-slide stagger-5" style={{ opacity: 0, animationFillMode: 'forwards' }}>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 curved-xl glow-btn text-white font-semibold transition"
                style={{ backgroundColor: '#14b8a6' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Creating account...
                  </span>
                ) : 'Sign Up'}
              </button>
            </div>
          </form>

          {/* FOOTER */}
          <div className="mt-6 text-center animate-fade-slide stagger-6" style={{ opacity: 0, animationFillMode: 'forwards' }}>
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium hover:underline text-gradient-teal"
              >
                Sign in
              </Link>
            </p>
          </div>

        </div>
      </div>
      <Footer />
    </div>
  );
}

