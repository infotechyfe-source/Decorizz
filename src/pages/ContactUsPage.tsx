import React, { useState, useEffect } from "react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { MapPin, Phone, Mail, Search as SearchIcon, Send } from "lucide-react";
import TiltCard from "../components/TiltCard";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { toast } from "sonner";

export default function ContactUsPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [instaPosts, setInstaPosts] = useState<{ id: string; embedUrl: string }[]>([]);

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;

    try {
      setSubmitting(true);
      const resp = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/contact-messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(form),
        }
      );

      const data = await resp.json();
      if (!resp.ok) toast.error(data.error || "Failed to send message");
      else {
        toast.success("Message sent successfully");
        setForm({ name: "", email: "", phone: "", subject: "", message: "" });
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/instagram`);
        const data = await res.json();
        setInstaPosts((data.items || []).slice(0, 6));
      } catch { }
    })();
  }, []);

  return (
    <div className="min-h-screen content-offset premium-bg">
      <Navbar />

      {/* HERO HEADER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="premium-card-glow p-8 sm:p-12 animate-fade-scale">
            <h1 className="text-center custom-heading">
              Contact <span className="text-gradient-teal">Us</span>
            </h1>
            <p className="text-center max-w-3xl mx-auto italic text-base sm:text-lg" style={{ color: "#4b5563" }}>
              Get in touch with us for any enquiries and questions
            </p>
          </div>
        </div>
      </section>

      {/* Main Layout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT FORM — PREMIUM 3D CARD */}
          <TiltCard className="lg:col-span-2 premium-card-glow p-8 animate-fade-slide">
            <h2 className="text-xl font-semibold mb-6" style={{ color: "#1f2937" }}>
              Send us a message
            </h2>

            <form onSubmit={onSubmit} className="space-y-6">

              {/* Name + Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#4b5563' }}>Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    className="w-full px-4 py-3 glow-input"
                    style={{ color: '#1f2937' }}
                    placeholder="Your Name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#4b5563' }}>Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    className="w-full px-4 py-3 glow-input"
                    style={{ color: '#1f2937' }}
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              {/* Phone + Subject */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#4b5563' }}>Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    className="w-full px-4 py-3 glow-input"
                    style={{ color: '#1f2937' }}
                    placeholder="+91 9258784544"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#4b5563' }}>Subject</label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={(e) => update("subject", e.target.value)}
                    className="w-full px-4 py-3 glow-input"
                    style={{ color: '#1f2937' }}
                    placeholder="How can we help?"
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#4b5563' }}>Message</label>
                <textarea
                  rows={6}
                  value={form.message}
                  onChange={(e) => update("message", e.target.value)}
                  className="w-full px-4 py-3 glow-input curved-lg"
                  style={{ color: '#1f2937' }}
                  placeholder="Write your message here"
                  required
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="glow-btn curved-lg px-6 py-3 text-white font-semibold"
                  style={{ backgroundColor: "#14b8a6" }}
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Sending...
                    </span>
                  ) : "Send Message"}
                </button>

                <button
                  type="reset"
                  className="px-6 py-3 curved-lg font-semibold transition glow-btn-white"
                  style={{ border: '1px solid rgba(20, 184, 166, 0.2)', color: '#1f2937' }}
                  onClick={() =>
                    setForm({
                      name: "",
                      email: "",
                      phone: "",
                      subject: "",
                      message: "",
                    })
                  }
                >
                  Clear
                </button>
              </div>

            </form>
          </TiltCard>

          {/* RIGHT SIDE CARDS */}
          <div className="space-y-6">

            {/* PHONE */}
            <TiltCard className="rounded-3xl shadow-lg p-6 transition-all duration-300 card-appear cursor-pointer" style={{ backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', border: '1px solid #e5e7eb' }}>
              <a href="tel:+919705180483" className="flex items-start gap-6 no-underline">

                {/* Icon circle */}
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#14b8a6]/10 to-[#3b2f27]/10 flex items-center justify-center shadow-inner">
                  <Phone className="w-6 h-6" color="#14b8a6" />
                </div>

                {/* Text */}
                <div>
                  <p className="text-lg font-semibold" style={{ color: '#1f2937' }}>Phone Number</p>
                  <p className="text-sm mt-1 hover:text-teal-600 transition-colors" style={{ color: '#4b5563' }}>+91 9705180483</p>
                </div>

              </a>
            </TiltCard>

            {/* EMAIL */}
            <TiltCard className="rounded-3xl shadow-lg p-6 transition-all duration-300 card-appear cursor-pointer" style={{ backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', border: '1px solid #e5e7eb' }}>
              <a href="mailto:Contact@decorizz.com" className="flex items-start gap-6 no-underline">

                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#14b8a6]/10 to-[#3b2f27]/10 flex items-center justify-center shadow-inner">
                  <Mail className="w-6 h-6" color="#14b8a6" />
                </div>

                <div>
                  <p className="text-lg font-semibold" style={{ color: '#1f2937' }}>Email Address</p>
                  <p className="text-sm mt-1 hover:text-teal-600 transition-colors" style={{ color: '#4b5563' }}>Contact@decorizz.com</p>
                </div>

              </a>
            </TiltCard>

            {/* LOCATION */}
            <TiltCard className="rounded-3xl shadow-lg p-6 transition-all duration-300 card-appear cursor-pointer" style={{ backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', border: '1px solid #e5e7eb' }}>
              <a href="https://www.google.com/maps/search/?api=1&query=Shakti+farm+market+Sitarganj+Udham+Singh+Nagar" target="_blank" rel="noopener noreferrer" className="flex items-start gap-6 no-underline">

                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#14b8a6]/10 to-[#3b2f27]/10 flex items-center justify-center shadow-inner">
                  <MapPin className="w-6 h-6" color="#14b8a6" />
                </div>

                <div>
                  <p className="text-lg font-semibold" style={{ color: '#1f2937' }}>Location</p>
                  <p className="text-sm mt-1 leading-relaxed hover:text-teal-600 transition-colors" style={{ color: '#4b5563' }}>
                    Gurugram Road, Near Subhash Chowk, Shaktifarm Market,<br />
                    Sitarganj, Udham Singh Nagar, 253151.
                  </p>
                </div>

              </a>
            </TiltCard>

          </div>


        </div>
      </section>



      {/* MAP SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <h3 className="custom-heading text-center">Find Us</h3>
        <p className="text-sm text-gray-600 text-center mt-2">
          Click the map to get directions instantly
        </p>

        <div className="relative mt-8 rounded-3xl overflow-hidden soft-card shadow-xl">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3489.2669416026324!2d79.64781057555636!3d29.00908607546123!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39a061f87cc0f677%3A0xe5fb13c9df318542!2sShakti%20farm%20market!5e0!3m2!1sen!2sin!4v1765270792894!5m2!1sen!2sin"
            width="100%"
            height="350"
            style={{
              border: "0",
              borderRadius: "18px",

            }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>

          {/* Overlaid Search Bar */}
          <div className="absolute left-4 top-4 bg-white rounded-full px-4 py-2 shadow flex items-center gap-2">
            <SearchIcon className="w-4 h-4 text-gray-600" />
            <input
              placeholder="Search..."
              className="bg-transparent outline-none text-sm w-40"
            />
            <Send className="w-4 h-4 text-gray-600" />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
