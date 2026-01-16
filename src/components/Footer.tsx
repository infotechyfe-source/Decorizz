import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import logoImage from "../assets/logo-r.png";


export function Footer() {
  const isDarkTheme = typeof document !== 'undefined' && !!document.querySelector('.dark-theme');
  const bg = isDarkTheme ? '#0f172a' : 'linear-gradient(135deg, #fdf9efff 0%, )';
  const text = isDarkTheme ? '#e5e7eb' : '#3b2f27';
  const subText = isDarkTheme ? '#cbd5e1' : '#4b5563';
  const border = isDarkTheme ? '#334155' : '#d1d5db';
  const chipBg = isDarkTheme ? 'transparent' : 'transparent';
  const accent = '#14b8a6';
  return (
    <footer style={{ backgroundColor: '#fdf9efff', color: text }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 items-start">
          <div className="flex flex-col md:items-start gap-4">
            <Link to="/" className="flex items-center gap-3">
              <img src={logoImage} alt="Decorizz" className="h-10 w-auto" />
              <span className="text-xl tracking-wide" style={{ fontWeight: 800 }}>DECORIZZ</span>
            </Link>
            <p className="text-sm max-w-sm" style={{ color: subText }}>Premium wall frames and artwork crafted to elevate modern spaces.</p>
            <div className="flex gap-3">
              <a href="https://www.facebook.com/profile.php?id=61583199180139" aria-label="Facebook" className="w-10 h-10 rounded-full border flex items-center justify-center" style={{ borderColor: accent, color: accent }}><Facebook className="w-5 h-5" /></a>
              <a href="https://www.instagram.com/decorizzdotcom?igsh=MzM5OWxyMWd1aXFz" aria-label="Instagram" className="w-10 h-10 rounded-full border flex items-center justify-center" style={{ borderColor: '#14b8a6', color: '#14b8a6' }}><Instagram className="w-5 h-5" /></a>
              {/* <a href="#" aria-label="Twitter" className="w-10 h-10 rounded-full border flex items-center justify-center" style={{ borderColor: '#14b8a6', color: '#14b8a6' }}><Twitter className="w-5 h-5" /></a> */}
            </div>

            {/* Newsletter */}
            <div className="mt-2 mb-2 w-full max-w-sm">
              <p className="text-sm" style={{ color: subText }}>Subscribe to get new arrivals and offers</p>
              <div className="flex gap-2">
                <input type="email" placeholder="Your email" className="flex-1 px-3 py-2 rounded-lg border" style={{ borderColor: border, backgroundColor: isDarkTheme ? '#0b1220' : '#ffffff', color: text }} />
                <button className="px-4 py-2 rounded-lg text-white" style={{ backgroundColor: accent }}>Subscribe</button>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg" style={{ color: accent, fontWeight: 700 }}>Company</h3>
            <ul className="space-y-2">
              <li><Link to="/about" className="hover:underline">About Us</Link></li>

              <li><Link to="/shop" className="hover:underline">Frames</Link></li>
              <li><Link to="/gallery" className="hover:underline">Gallery</Link></li>
              <li><Link to="/shop-by-videos" className="hover:underline">Shop by Videos</Link></li>
              <li><Link to="/contact" className="hover:underline">Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg" style={{ color: accent, fontWeight: 700 }}>Customer Care</h3>
            <ul className="space-y-2">
              <li><Link to="/contact" className="hover:underline">Shipping & Delivery</Link></li>
              <li><Link to="/refunds" className="hover:underline">Returns & Refunds</Link></li>
              <li><Link to="/contact" className="hover:underline">Track Order</Link></li>
              <li><Link to="/terms" className="hover:underline">Terms</Link></li>
              <li><Link to="/privacy" className="hover:underline">Privacy</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg" style={{ color: accent, fontWeight: 700 }}>Contact</h3>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <a href="tel:+919705180483" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#14b8a6', color: '#fff' }}>
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm" style={{ fontWeight: 700 }}>Call us</p>
                    <p className="hover:text-teal-600 transition-colors">+91 970 5180 483</p>
                  </div>
                </a>
              </li>
              <li className="flex items-center gap-3">
                <a href="mailto:info@decorizz.com" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#14b8a6', color: '#fff' }}>
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm" style={{ fontWeight: 700 }}>Mail Us</p>
                    <p className="hover:text-teal-600 transition-colors">info@decorizz.com</p>
                  </div>
                </a>
              </li>
              <li className="flex items-start gap-3">
                <a href="https://www.google.com/maps/search/?api=1&query=Shakti+farm+market+Sitarganj+Udham+Singh+Nagar" target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 hover:opacity-80 transition-opacity">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#14b8a6', color: '#fff' }}>
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm" style={{ fontWeight: 700 }}>Address</p>
                    <p className="hover:text-teal-600 transition-colors">Udham Singh Nagar 263151</p>
                  </div>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10" style={{ borderTop: `1.5px solid ${accent}` }}></div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 text-sm">
          <p>© {new Date().getFullYear()} Decorizz. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3 py-1 rounded-full border text-xs" style={{ borderColor: border }}>Visa</span>
            <span className="px-3 py-1 rounded-full border text-xs" style={{ borderColor: border }}>MasterCard</span>
            <span className="px-3 py-1 rounded-full border text-xs" style={{ borderColor: border }}>UPI</span>
            <span className="px-3 py-1 rounded-full border text-xs" style={{ borderColor: border }}>COD (partial)</span>
          </div>
          <div className="flex gap-4">
            <Link to="/terms" className="hover:underline">Terms</Link>
            <Link to="/privacy" className="hover:underline">Privacy</Link>
            <Link to="/refunds" className="hover:underline">Refunds</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
