import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FiMenu, FiX, FiLogOut, FiLayout, FiUploadCloud, FiClock, FiSettings } from 'react-icons/fi';

export const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
      isActive
        ? 'bg-gradient-to-r from-accent-purple/20 to-accent-blue/20 text-white border border-accent-purple/30'
        : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
    }`;

  return (
    <nav className="sticky top-0 z-40 w-full bg-space-900/75 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            {/* Logo Image */}
            <img 
              src="/logo.png" 
              alt="IRVision AI Logo" 
              className="w-10 h-10 rounded-lg shadow-md group-hover:scale-105 transition-transform object-cover" 
            />
            <div className="flex flex-col">
              <span className="font-display font-bold text-base tracking-wide text-white leading-none mb-0.5">IRVision AI</span>
              <span className="text-[9px] text-slate-400 font-medium leading-tight">
                Advanced Infrared Image Enhancement & Colorization Platform
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-2">
              <NavLink to="/dashboard" className={navItemClass}>
                <FiLayout className="w-4 h-4" />
                Dashboard
              </NavLink>
              <NavLink to="/upload" className={navItemClass}>
                <FiUploadCloud className="w-4 h-4" />
                Upload
              </NavLink>
              <NavLink to="/history" className={navItemClass}>
                <FiClock className="w-4 h-4" />
                History
              </NavLink>
              {user?.is_admin && (
                <NavLink to="/admin" className={navItemClass}>
                  <FiSettings className="w-4 h-4" />
                  Admin
                </NavLink>
              )}
            </div>
          )}

          {/* User Section */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3 pl-3 border-l border-white/10">
                <div 
                  onClick={() => setProfileModalOpen(true)}
                  className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                  title="View Profile Details"
                >
                  <div className="flex flex-col text-right">
                    <span className="text-sm font-semibold text-white">{user?.full_name}</span>
                    <span className="text-[10px] text-slate-400 capitalize">
                      {user?.is_admin ? 'Systems Admin' : 'Researcher'}
                    </span>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-space-700 border border-white/10 flex items-center justify-center text-white font-bold uppercase shadow-inner overflow-hidden">
                    {user?.picture_url ? (
                      <img src={user.picture_url} alt={user.full_name} className="w-full h-full object-cover" />
                    ) : (
                      user?.full_name.substring(0, 2)
                    )}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-rose-500/10 transition-colors ml-1"
                >
                  <FiLogOut className="w-4.5 h-4.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-slate-300 hover:text-white text-sm font-medium px-4 py-2">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary py-2 text-sm">
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              {mobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-space-900 border-b border-white/10 px-4 pt-2 pb-4 space-y-2">
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-slate-200"
              >
                <FiLayout className="w-5 h-5" />
                Dashboard
              </Link>
              <Link
                to="/upload"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-slate-200"
              >
                <FiUploadCloud className="w-5 h-5" />
                Upload Image
              </Link>
              <Link
                to="/history"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-slate-200"
              >
                <FiClock className="w-5 h-5" />
                History Records
              </Link>
              {user?.is_admin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-slate-200"
                >
                  <FiSettings className="w-5 h-5" />
                  Admin settings
                </Link>
              )}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <div 
                  onClick={() => { setMobileMenuOpen(false); setProfileModalOpen(true); }}
                  className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                  title="View Profile Details"
                >
                  <div className="w-9 h-9 rounded-full bg-space-750 border border-white/15 flex items-center justify-center text-white font-bold uppercase overflow-hidden">
                    {user?.picture_url ? (
                      <img src={user.picture_url} alt={user.full_name} className="w-full h-full object-cover" />
                    ) : (
                      user?.full_name.substring(0, 2)
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{user?.full_name}</div>
                    <div className="text-xs text-slate-400">{user?.email}</div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <FiLogOut className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center p-3 rounded-xl hover:bg-white/5 text-slate-200"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-primary w-full text-center py-3"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Profile Details Modal */}
      {profileModalOpen && user && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="max-w-md w-full bg-[#0f0c1b] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative animate-scale-up">
            {/* Header Banner */}
            <div className="h-28 bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] relative flex items-center justify-center">
              {/* Close Button */}
              <button
                onClick={() => setProfileModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-black/30 text-white hover:bg-black/55 transition-colors"
                title="Close"
              >
                <FiX className="w-5 h-5" />
              </button>

              {/* Avatar Initials Circle */}
              <div className="absolute -bottom-10 w-20 h-20 rounded-full bg-[#1b1437] border-4 border-[#0f0c1b] flex items-center justify-center shadow-xl text-white text-2xl font-black uppercase tracking-wider overflow-hidden">
                {user.picture_url ? (
                  <img src={user.picture_url} alt={user.full_name} className="w-full h-full object-cover" />
                ) : (
                  user.full_name.substring(0, 2)
                )}
              </div>
            </div>

            {/* Content Area */}
            <div className="pt-14 pb-8 px-8">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white tracking-wide">{user.full_name}</h3>
                <p className="text-xs text-accent-purple font-semibold tracking-wider uppercase mt-1">
                  {user.is_admin ? 'Systems Administrator' : 'ISRO Space Researcher'}
                </p>
              </div>

              {/* Details List */}
              <div className="space-y-4 border-t border-b border-white/10 py-6 my-6 text-sm">
                <div className="flex justify-between items-center gap-4">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Email Address</span>
                  <span className="text-white font-medium break-all">{user.email}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Auth Provider</span>
                  {user.is_google_user ? (
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <svg className="w-3 h-3" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.478 0-6.3-2.822-6.3-6.3 0-3.478 2.822-6.3 6.3-6.3 1.637 0 3.107.619 4.233 1.637l3.054-3.054C19.123 2.507 15.938 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c5.897 0 10.874-4.053 10.874-11.24 0-.568-.057-1.113-.147-1.637h-10.727z"
                        />
                      </svg>
                      Google Identity
                    </span>
                  ) : (
                    <span className="bg-accent-blue/10 text-accent-blue border border-accent-blue/20 text-[10px] font-bold px-2.5 py-1 rounded-full">
                      Secure Password
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Commissioned</span>
                  <span className="text-slate-300 font-medium">
                    {new Date(user.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Access Clearance</span>
                  <span className="text-slate-300 font-bold bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[10px] uppercase">
                    Level {user.is_admin ? '3 (Admin)' : '1 (Researcher)'}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => setProfileModalOpen(false)}
                className="w-full bg-gradient-to-r from-accent-purple to-accent-blue hover:opacity-90 text-white py-3 rounded-xl text-xs font-bold tracking-wider uppercase transition-opacity shadow-lg"
              >
                Close Scientist Sheet
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
export default Navbar;