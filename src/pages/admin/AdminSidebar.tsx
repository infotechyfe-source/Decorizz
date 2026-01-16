import React, { useEffect, useState, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Star,
  Image as GalleryIcon,
  CreditCard,
  Truck,
  Mail,
  HelpCircle,
  Film,
  Instagram,
  LogOut,
  Menu,
  Tag,
  X,
} from "lucide-react";

interface AdminSidebarProps {
  onSidebarWidthChange?: (width: number) => void;
}

export default function AdminSidebar({ onSidebarWidthChange }: AdminSidebarProps) {
  const { logout } = useContext(AuthContext);
  const location = useLocation();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Auto detect screen size
  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);

      if (mobile) {
        setMobileOpen(false);
      }

      if (!mobile && onSidebarWidthChange) {
        onSidebarWidthChange(collapsed ? 80 : 256);
      }
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [collapsed]);

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setCollapsed(!collapsed);
      if (onSidebarWidthChange) {
        onSidebarWidthChange(!collapsed ? 80 : 256);
      }
    }
  };

  const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
    { label: "Products", icon: Package, path: "/admin/products" },
    { label: "Orders", icon: ShoppingBag, path: "/admin/orders" },
    { label: "Users", icon: Users, path: "/admin/users" },
    { label: "Gallery", icon: GalleryIcon, path: "/admin/gallery" },
    { label: "Payments", icon: CreditCard, path: "/admin/payments" },
    // { label: "Delivery", icon: Truck, path: "/admin/delivery" },
    { label: "Testimonials", icon: Star, path: "/admin/testimonials" },
    { label: "Contacts", icon: Mail, path: "/admin/contacts" },
    { label: "FAQs", icon: HelpCircle, path: "/admin/faqs" },
    { label: "Home Sections", icon: LayoutDashboard, path: "/admin/home-sections" },
    { label: "Videos", icon: Film, path: "/admin/videos" },
    { label: "Offers", icon: Tag, path: "/admin/offers" },
    // { label: "Instagram", icon: Instagram, path: "/admin/instagram" },
  ];

  return (
    <>
      {/* TOGGLE BUTTON */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 ml-2 left-4 z-50 bg-gray-900 text-white p-3 rounded-lg shadow-lg"
      >
        {isMobile && mobileOpen ? <X /> : <Menu />}
      </button>

      {/* MOBILE OVERLAY */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        ></div>
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          admin-sidebar fixed inset-y-0 left-0 bg-gray-900 text-white shadow-xl z-50
          transition-transform duration-300 flex flex-col will-change-transform
          ${isMobile
            ? mobileOpen
              ? "sidebar-mobile-shown w-64"
              : "sidebar-mobile-hidden w-64"
            : collapsed
              ? "sidebar-desktop-mini"
              : "sidebar-desktop-full"
          }
        `}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          {!collapsed && <h2 className="text-xl font-semibold">Admin Panel</h2>}

          {isMobile && (
            <X
              className="w-6 h-6 text-gray-300 cursor-pointer"
              onClick={() => setMobileOpen(false)}
            />
          )}
        </div>

        {/* MENU ITEMS */}
        <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto pr-2">
          {menuItems.map(({ label, icon: Icon, path }) => {
            const active = location.pathname === path;

            return (
              <Link
                key={path}
                to={path}
                onClick={() => isMobile && setMobileOpen(false)}
                className={`admin-nav-item flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${active ? "active" : "text-gray-300 hover:bg-gray-800"
                  }`}
              >
                <Icon className="menu-icon w-5 h-5" />
                <span className="menu-label">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* LOGOUT */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 transition"
          >
            <LogOut className="menu-icon w-5 h-5" />
            <span className="menu-label">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
