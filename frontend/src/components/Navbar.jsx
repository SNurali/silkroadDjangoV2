import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  Menu, X, Bell, Sun, Moon,
  User, Settings, LogOut
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { getNotifications, markAllNotificationsRead } from '../services/api';
import LanguageSwitcher from './LanguageSwitcher';
import VendorSwitch from './VendorSwitch';

// --- Components ---

const NavItem = ({ to, children }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        twMerge(
          "relative px-4 py-2 text-sm font-medium transition-all duration-300 rounded-full group",
          isActive
            ? "text-white"
            : "text-gray-300 hover:text-white"
        )
      }
    >
      {({ isActive }) => (
        <>
          <span className="relative z-10 flex items-center gap-2">
            {children}
          </span>

          {/* Hover Glow - Subtle */}
          <span className="absolute inset-0 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />

          {/* Active Underline Gradient */}
          {isActive && (
            <motion.div
              layoutId="navbar-activeline"
              className="absolute bottom-0 left-3 right-3 h-[2px] bg-gradient-to-r from-amber-400 to-amber-600 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.4, type: "spring" }}
            />
          )}
        </>
      )}
    </NavLink>
  );
};

const IconButton = ({ onClick, icon: Icon, badgeCount, active, className }) => (
  <motion.button
    whileHover={{ scale: 1.1, rotate: 12 }}
    whileTap={{ scale: 0.9 }}
    onClick={onClick}
    className={twMerge(
      "relative p-2 rounded-full transition-colors duration-300",
      active
        ? "text-amber-400 bg-amber-400/10 ring-1 ring-amber-400/30"
        : "text-gray-400 hover:text-amber-400 hover:bg-white/5",
      className
    )}
  >
    <Icon size={22} strokeWidth={1.5} />
    {badgeCount > 0 && (
      <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-[#0f0703] animate-pulse">
        {badgeCount > 9 ? '9+' : badgeCount}
      </span>
    )}
  </motion.button>
);

// --- Main Navbar ---

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Debug: Check user role
  useEffect(() => {
    if (user) {
      console.log('Navbar user:', user);
      console.log('User role:', user.role);
    }
  }, [user]);

  // State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [isScrolled, setIsScrolled] = useState(false);

  // Scroll Animation Hooks
  const { scrollY } = useScroll();
  const navBackground = useTransform(
    scrollY,
    [0, 50],
    ["rgba(15, 7, 3, 0)", "rgba(15, 7, 3, 0.85)"] // Warm dark transparent -> blurred
  );
  const navBackdropBlur = useTransform(scrollY, [0, 50], ["0px", "12px"]);
  const navHeight = useTransform(scrollY, [0, 50], ["96px", "70px"]);
  const navBorder = useTransform(
    scrollY,
    [0, 50],
    ["rgba(245, 158, 11, 0)", "rgba(245, 158, 11, 0.15)"] // Amber border fade in
  );

  useEffect(() => {
    return scrollY.on("change", (latest) => {
      setIsScrolled(latest > 50);
    });
  }, [scrollY]);

  // Theme & Notifications Logic
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Basic polling for notifs
  useEffect(() => {
    if (user) {
      const fetchNotifs = async () => {
        try {
          const res = await getNotifications();
          setNotifications(res.results || res);
        } catch (e) { console.error(e); }
      };
      fetchNotifs();
      const interval = setInterval(fetchNotifs, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
    setActiveDropdown(null);
  };

  return (
    <>
      <motion.nav
        style={{
          backgroundColor: navBackground,
          backdropFilter: navBackdropBlur,
          height: navHeight,
          borderBottom: '1px solid',
          borderColor: navBorder
        }}
        className="fixed top-0 left-0 right-0 z-[100] transition-colors duration-500 ease-out"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full">

            {/* --- Logo --- */}
            <Link to="/" className="group relative flex items-center gap-1 min-w-[140px]">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="flex items-baseline"
              >
                <span className="text-2xl md:text-3xl font-bold text-white tracking-tight drop-shadow-lg">Silk</span>
                <span className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-400 via-amber-500 to-orange-600 bg-clip-text text-transparent tracking-tighter ml-0.5 group-hover:brightness-125 transition-all">Road.</span>
              </motion.div>
              <div className="absolute -bottom-1 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </Link>

            {/* --- Desktop Menu --- */}
            <div className="hidden lg:flex items-center gap-1">
              {[
                { name: t('navbar.hotels'), to: '/hotels' },
                { name: t('navbar.flights'), to: '/flights' },
                { name: t('navbar.tours'), to: '/tours' },
                { name: t('navbar.cabs'), to: '/cabs' },
                { name: t('navbar.visa'), to: '/visa' },
                { name: t('navbar.blog'), to: '/blog' },
              ].map((item) => (
                <NavItem key={item.to} to={item.to}>{item.name}</NavItem>
              ))}
            </div>

            {/* --- Right Actions --- */}
            <div className="hidden lg:flex items-center gap-4">

              {/* Vendor Switch */}
              <VendorSwitch className="mr-2" />

              {/* Language (Wrapper for existing component for layout) */}
              <div className="relative z-50 opacity-80 hover:opacity-100 transition-opacity">
                <LanguageSwitcher />
              </div>

              {/* Theme Toggle */}
              <IconButton
                icon={theme === 'dark' ? Moon : Sun}
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="hover:rotate-45"
              />

              {/* Notifications */}
              <div className="relative">
                <IconButton
                  icon={Bell}
                  badgeCount={unreadCount}
                  active={activeDropdown === 'notif'}
                  onClick={() => setActiveDropdown(activeDropdown === 'notif' ? null : 'notif')}
                />
                <AnimatePresence>
                  {activeDropdown === 'notif' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-4 w-80 bg-[#120a05] border border-amber-900/30 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/5 backdrop-blur-xl"
                    >
                      <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                        <span className="text-sm font-bold text-amber-500">{t('navbar.notifications')}</span>
                        {unreadCount > 0 && <button onClick={markAllNotificationsRead} className="text-xs text-gray-400 hover:text-white transition-colors">{t('navbar.clear_all')}</button>}
                      </div>
                      <div className="max-h-64 overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-gray-500 text-sm">{t('navbar.no_notifications')}</div>
                        ) : (
                          notifications.map(n => (
                            <div
                              key={n.id}
                              onClick={async () => {
                                if (n.link) {
                                  navigate(n.link);
                                  setActiveDropdown(null);
                                }
                                if (!n.is_read) {
                                  // Optimistically mark read
                                  setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, is_read: true } : item));
                                  try {
                                    await markNotificationRead(n.id);
                                  } catch (e) { console.error(e); }
                                }
                              }}
                              className={`p-3 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${n.is_read ? 'opacity-50' : 'bg-white/5 border-l-2 border-l-amber-500'}`}
                            >
                              <p className="text-sm text-gray-200">{n.title}</p>
                              <p className="text-xs text-gray-500">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Vertical Divider */}
              <div className="h-6 w-[1px] bg-gradient-to-b from-transparent via-gray-700 to-transparent"></div>

              {/* Auth Buttons */}
              {user ? (
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveDropdown(activeDropdown === 'profile' ? null : 'profile')}
                    className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full bg-white/5 border border-white/10 hover:border-amber-500/30 transition-all"
                  >
                    <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.name}&background=f59e0b&color=fff`} className="w-8 h-8 rounded-full border border-gray-800 object-cover" alt="avatar" />
                    <span className="text-sm font-medium text-gray-200">{user.name.split(' ')[0]}</span>
                  </motion.button>

                  <AnimatePresence>
                    {activeDropdown === 'profile' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-4 w-56 bg-[#120a05] border border-amber-900/30 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/5 z-[150]"
                      >
                        <div className="p-4 border-b border-white/5 bg-gradient-to-r from-amber-500/10 to-transparent">
                          <p className="text-sm font-bold text-white">{user.name}</p>
                          <p className="text-xs text-amber-500">{user.email}</p>
                        </div>
                        <div className="p-2 space-y-1">
                          <Link to="/profile" onClick={() => setActiveDropdown(null)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-amber-400 rounded-lg transition-colors">
                            <User size={16} /> {t('navbar.profile')}
                          </Link>
                          {(user?.role === 'vendor' || user?.role === 'vendor_op') && (
                            <Link to="/vendor/dashboard" onClick={() => setActiveDropdown(null)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-amber-400 rounded-lg transition-colors">
                              <Settings size={16} /> {t('navbar.vendor')}
                            </Link>
                          )}
                          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                            <LogOut size={16} /> {t('navbar.signout')}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/login">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-5 py-2.5 text-sm font-semibold text-amber-400 hover:text-amber-300 border border-amber-500/30 rounded-full hover:bg-amber-500/10 transition-all"
                    >
                      {t('navbar.signin')}
                    </motion.button>
                  </Link>
                  <Link to="/register">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-2.5 text-sm font-bold text-white rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all"
                    >
                      {t('navbar.signup')}
                    </motion.button>
                  </Link>
                </div>
              )}
            </div>

            {/* --- Mobile Hamburger --- */}
            <div className="lg:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 text-white/80 hover:text-amber-400 transition-colors"
              >
                <Menu size={28} />
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* --- Mobile Menu Overlay --- */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110]"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 right-0 w-[85%] max-w-sm bg-[#0f0703] border-l border-white/10 shadow-2xl z-[120] overflow-y-auto"
            >
              <div className="p-6 space-y-8">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-600 bg-clip-text text-transparent">SilkRoad.</span>
                  <motion.button
                    whileTap={{ rotate: 90 }}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-full bg-white/5 text-gray-400 hover:text-white"
                  >
                    <X size={24} />
                  </motion.button>
                </div>

                <div className="space-y-4">
                  {[
                    { name: t('navbar.hotels'), to: '/hotels' },
                    { name: t('navbar.flights'), to: '/flights' },
                    { name: t('navbar.tours'), to: '/tours' },
                    { name: t('navbar.cabs'), to: '/cabs' },
                    { name: t('navbar.visa'), to: '/visa' },
                    { name: t('navbar.blog'), to: '/blog' },
                  ].map(item => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={({ isActive }) => twMerge(
                        "block px-4 py-3 rounded-xl text-lg font-medium transition-all",
                        isActive
                          ? "bg-gradient-to-r from-amber-500/20 to-transparent text-amber-500 border-l-2 border-amber-500"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      )}
                    >
                      {item.name}
                    </NavLink>
                  ))}
                </div>

                <div className="pt-8 border-t border-white/10 space-y-6">
                  {/* Mobile Actions */}
                  <div className="flex items-center justify-between px-4">
                    <span className="text-gray-400 text-sm">{t('navbar.theme')}</span>
                    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 bg-white/5 rounded-lg text-amber-400">
                      {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                    </button>
                  </div>

                  {user ? (
                    <div className="px-4">
                      <div className="flex items-center gap-4 mb-6">
                        <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.name}`} className="w-12 h-12 rounded-full ring-2 ring-amber-500/50 object-cover" alt="" />
                        <div>
                          <p className="text-white font-bold">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="py-2.5 text-center rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-sm">{t('navbar.profile')}</Link>
                        {(user?.role === 'vendor' || user?.role === 'vendor_op') && (
                          <Link to="/vendor/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="py-2.5 text-center rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-sm">{t('navbar.vendor')}</Link>
                        )}
                        <button onClick={handleLogout} className="py-2.5 text-center rounded-lg bg-red-500/10 text-red-400 text-sm col-span-2">{t('navbar.signout')}</button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 px-4">
                      <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="py-3 text-center rounded-xl border border-white/10 text-white font-semibold">{t('navbar.signin')}</Link>
                      <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="py-3 text-center rounded-xl bg-amber-500 text-black font-bold shadow-lg shadow-amber-500/20">{t('navbar.signup')}</Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}