import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';
import { Building, User, ArrowLeftRight } from 'lucide-react';

const VendorSwitch = ({ className }) => {
  const { user, switchToVendor, switchToUser, isUserAndVendor } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.vendor-switch')) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSwitchToVendor = async () => {
    try {
      await switchToVendor();
      window.location.href = '/vendor/dashboard';
    } catch (error) {
      console.error('Failed to switch to vendor:', error);
    }
    setShowDropdown(false);
  };

  const handleSwitchToUser = async () => {
    try {
      await switchToUser();
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to switch to user:', error);
    }
    setShowDropdown(false);
  };

  const isVendorUser = user?.role === 'vendor' || user?.role === 'vendor_op' || user?.role === 'hotel_admin';

  if (!user || (!isUserAndVendor() && !isVendorUser)) {
    return null;
  }

  return (
    <div className={twMerge('relative vendor-switch', className)}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-500/10 to-amber-500/10 border border-purple-500/30 hover:border-purple-500/50 transition-all"
      >
        <div className="flex items-center gap-2">
          {isUserAndVendor() ? (
            <User size={16} className="text-purple-400" />
          ) : (
            <Building size={16} className="text-amber-400" />
          )}
        </div>
        <div className="text-xs text-white">
          {isUserAndVendor() ? 'User' : 'Vendor'}
        </div>
        <ArrowLeftRight size={14} className="text-gray-400" />
      </motion.button>

      {/* Dropdown */}
      {showDropdown && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className="absolute right-0 mt-2 w-56 bg-[#120a05] border border-amber-900/30 rounded-xl shadow-2xl overflow-hidden ring-1 ring-white/5 z-50"
        >
          <div className="p-3 border-b border-white/5 bg-gradient-to-r from-purple-500/10 to-amber-500/10">
            <p className="text-sm font-bold text-white">
              {user.name}
            </p>
            <p className="text-xs text-gray-400">
              Switch Role
            </p>
          </div>
          
          <div className="p-2 space-y-1">
            {isUserAndVendor() ? (
              <button
                onClick={handleSwitchToVendor}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors"
              >
                <Building size={16} />
                Switch to Vendor Mode
              </button>
            ) : (
              <button
                onClick={handleSwitchToUser}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
              >
                <User size={16} />
                Switch to User Mode
              </button>
            )}
            
            <Link
              to={isUserAndVendor() ? "/profile" : "/vendor/dashboard"}
              onClick={() => setShowDropdown(false)}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-300 hover:bg-white/10 hover:text-amber-400 rounded-lg transition-colors"
            >
              {isUserAndVendor() ? <User size={16} /> : <Building size={16} />}
              {isUserAndVendor() ? "User Profile" : "Vendor Dashboard"}
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default VendorSwitch;