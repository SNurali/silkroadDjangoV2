import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  Menu, X, Bell, Sun, Moon, Globe,
  User, Settings, LogOut, ChevronDown, Check
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import api, { getNotifications, markNotificationRead, markAllNotificationsRead } from '../services/api';
import SilkRoadLogo from './SilkRoadLogo';
import LanguageSwitcher from './LanguageSwitcher';

// --- Utility Components ---

const NavItem = ({ to, children }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        twMerge(
          "relative px-3 py-2 text-sm font-medium transition-colors duration-300 rounded-lg group",
          isActive
            ? "text-indigo-600 dark:text-indigo-400"
            : "text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
        )
      }
    >
      {({ isActive }) => (
        <>
          <span className="relative z-10">{children}</span>
          {/* Hover Glow & Scale Effect */}
          <span className="absolute inset-0 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Active Underline Gradient */}
          {isActive && (
            <motion.div
              layoutId="navbar-underline"
              className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-600 to-blue-500 rounded-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </>
      )}
    </NavLink>
  );
};

const IconButton = ({ onClick, icon: Icon, badgeCount, active }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={twMerge(
      "relative p-2.5 rounded-full transition-all duration-300",
      active
        ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-100 dark:ring-indigo-500/30"
        : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
    )}
  >
    <Icon size={20} strokeWidth={2} />
    {badgeCount > 0 && (
      <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900 animate-pulse">
        {badgeCount > 9 ? '9+' : badgeCount}
      </span>
    )}
  </motion.button>
);

// --- Main Component ---

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null); // 'lang', 'profile', 'notif'
  const [notifications, setNotifications] = useState([]);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [isScrolled, setIsScrolled] = useState(false);

  // Scroll Detection
  const { scrollY } = useScroll();

  useEffect(() => {
    return scrollY.on("change", (latest) => {
      setIsScrolled(latest > 20);
    });
  }, [scrollY]);

  // Theme Sync
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Language Sync
  const currentLang = i18n.language || 'en';
  const handleLangChange = (lang) => {
    i18n.changeLanguage(lang);
    handleDropdownClose();
  };

  // Notifications
  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    if (user) {
      const fetchNotifs = async () => {
        try {
          const res = await getNotifications();
          setNotifications(res.results || res);
        } catch (e) {
          console.error("Notif fetch error", e);
        }
      };
      fetchNotifs();
      const interval = setInterval(fetchNotifs, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleDropdownToggle = (menu) => {
    setActiveDropdown(activeDropdown === menu ? null : menu);
  };

  const handleDropdownClose = () => {
    setActiveDropdown(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleDropdownClose();
  };

  // --- Animation Variants ---
  const dropdownVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: "easeOut" } },
    exit: { opacity: 0, y: 10, scale: 0.95, transition: { duration: 0.15 } }
  };

  // --- Flags Map ---
  const flags = {
    en: "🇺🇸",
    ru: "🇷🇺",
    uz: "🇺🇿"
  };

  return (
    <>
      <motion.nav
        className={twMerge(
          "fixed top-0 left-0 right-0 z-[100] border-b transition-all duration-300 ease-in-out",
          isScrolled
            ? "bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-800/50 shadow-md h-16"
            : "bg-white dark:bg-slate-900 border-transparent h-24"
        )}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full">

            {/* Logo Section */}
            <motion.div
              className="flex-shrink-0 flex items-center gap-2"
              layout
            >
              <Link to="/" className="group relative flex items-center">
                <SilkRoadLogo
                  className={twMerge(
                    "transition-all duration-300",
                    isScrolled ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl"
                  )}
                />
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {[
                { name: t('navbar.hotels', 'Hotels'), to: '/hotels' },
                { name: t('navbar.flights', 'Flights'), to: '/flights' },
                { name: t('navbar.tours', 'Tours'), to: '/tours' },
                { name: t('navbar.cabs', 'Cabs'), to: '/cabs' },
                { name: t('navbar.visa', 'Visa'), to: '/visa' },
                { name: t('navbar.blog', 'Blog'), to: '/blog' },
                { name: t('navbar.contact', 'Contact'), to: '/contact' },
              ].map((item) => (
                <NavItem key={item.to} to={item.to}>{item.name}</NavItem>
              ))}
            </div>

            {/* Right Actions */}
            <div className="hidden lg:flex items-center gap-3">

              {/* Language Switcher */}
              <div className="relative z-50">
                <LanguageSwitcher />
              </div>

              {/* Theme Toggle */}
              <IconButton
                icon={theme === 'dark' ? Moon : Sun}
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              />

              {/* Notifications */}
              <div className="relative">
                <IconButton
                  icon={Bell}
                  badgeCount={unreadCount}
                  active={activeDropdown === 'notif'}
                  onClick={() => handleDropdownToggle('notif')}
                />
                <AnimatePresence>
                  {activeDropdown === 'notif' && (
                    <motion.div
                      variants={dropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center backdrop-blur-sm">
                        <h4 className="font-semibold text-sm text-slate-900 dark:text-white">Notifications</h4>
                        {unreadCount > 0 && (
                          <button onClick={markAllNotificationsRead} className="text-xs text-indigo-600 hover:underline font-medium">Clear all</button>
                        )}
                      </div>
                      <div className="max-h-[300px] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-slate-500 text-sm">No new notifications</div>
                        ) : (
                          notifications.map((n) => (
                            <div key={n.id} className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0 relative">
                              {!n.is_read && <span className="absolute left-1 top-4 w-1.5 h-1.5 bg-blue-500 rounded-full" />}
                              <p className="text-sm text-slate-800 dark:text-slate-200 font-medium truncate">{n.title}</p>
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Profile */}
              {user ? (
                <div className="relative ml-2">
                  <motion.button
                    onClick={() => handleDropdownToggle('profile')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative p-0.5 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500"
                  >
                    <div className="rounded-full p-0.5 bg-white dark:bg-slate-950">
                      <img
                        src={user.avatar_url || user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=6366f1&color=fff`}
                        alt="Profile"
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    </div>
                    {/* Online Status */}
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                  </motion.button>

                  <AnimatePresence>
                    {activeDropdown === 'profile' && (
                      <motion.div
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden"
                      >
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                        <div className="p-2">
                          <Link to="/profile" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                            <User size={16} /> {t('navbar.profile', 'Profile')}
                          </Link>
                          <Link to="/vendor" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                            <Settings size={16} /> {t('navbar.vendor', 'Vendor Dashboard')}
                          </Link>
                          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors mt-1">
                            <LogOut size={16} /> {t('navbar.signout', 'Sign Out')}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center gap-3 ml-2">
                  <Link to="/login" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    {t('navbar.signin', 'Sign In')}
                  </Link>
                  <Link to="/register" className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg blur opacity-60 group-hover:opacity-100 transition duration-200"></div>
                    <button className="relative px-5 py-2 bg-white dark:bg-slate-900 rounded-lg leading-none flex items-center">
                      <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                        {t('navbar.signup', 'Get Started')}
                      </span>
                    </button>
                  </Link>
                </div>
              )}

              {/* Mobile Toggle */}
              <button
                className="lg:hidden p-2 text-slate-600 dark:text-slate-300"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu size={24} />
              </button>
            </div>

            {/* Mobile Only: Simple right align if needed (e.g. if we want logo center)
                For now, preserving typical left-logo, right-menu structure for mobile.
            */}
            <div className="lg:hidden flex items-center gap-4">
              <button
                className="p-2 text-slate-600 dark:text-slate-300"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu size={24} />
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
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              className="fixed top-0 left-0 bottom-0 w-[80%] max-w-sm bg-white dark:bg-slate-900 z-[120] shadow-2xl overflow-y-auto"
              initial={{ x: "-100%" }}
              animate={{ x: "0%" }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="p-6 space-y-8">
                <div className="flex items-center justify-between">
                  <img
                    src={theme === 'dark' ? "/silkroad-logo-dark-theme.png" : "/silkroad-logo-light-theme.png"}
                    alt="SilkRoad"
                    className="h-10 w-auto"
                  />
                  <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                    <X size={20} className="text-slate-600 dark:text-slate-300" />
                  </button>
                </div>

                {/* Mobile Links */}
                <div className="space-y-2">
                  {[
                    { name: t('navbar.hotels'), to: '/hotels' },
                    { name: t('navbar.flights'), to: '/flights' },
                    { name: t('navbar.tours'), to: '/tours' },
                    { name: t('navbar.cabs'), to: '/cabs' },
                    { name: t('navbar.blog'), to: '/blog' },
                  ].map(item => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={({ isActive }) => twMerge(
                        "block px-4 py-3 rounded-xl text-base font-semibold transition-colors",
                        isActive
                          ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      )}
                    >
                      {item.name}
                    </NavLink>
                  ))}
                </div>

                {/* Mobile Actions */}
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-500">Theme</span>
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                      <button onClick={() => setTheme('light')} className={twMerge("p-2 rounded-md transition-all", theme === 'light' ? "bg-white shadow text-indigo-600" : "text-slate-400")}>
                        <Sun size={18} />
                      </button>
                      <button onClick={() => setTheme('dark')} className={twMerge("p-2 rounded-md transition-all", theme === 'dark' ? "bg-slate-700 shadow text-indigo-400" : "text-slate-400")}>
                        <Moon size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-500">Language</span>
                    <div className="flex gap-2">
                      {Object.keys(flags).map(code => (
                        <button key={code} onClick={() => handleLangChange(code)} className={twMerge("text-xl p-1 rounded border", currentLang === code ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20" : "border-transparent opacity-50")}>
                          {flags[code]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {user ? (
                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3 mb-4">
                      <img src={user.avatar_url || user.avatar || `https://ui-avatars.com/api/?name=${user.name}`} className="h-10 w-10 rounded-full" alt="" />
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                    <button onClick={handleLogout} className="w-full py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 font-semibold flex items-center justify-center gap-2">
                      <LogOut size={18} /> Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="pt-6 grid grid-cols-2 gap-3">
                    <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="py-3 text-center rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200">Log In</Link>
                    <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="py-3 text-center rounded-xl bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/30">Sign Up</Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}