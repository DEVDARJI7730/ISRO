import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { FiMail, FiLock, FiKey, FiArrowRight, FiArrowLeft, FiAlertTriangle } from 'react-icons/fi';
import api from '../utils/api';

export const ForgotPasswordPage: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showToast('Please enter your email address.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await api.post('/api/auth/forgot-password', { email });
      showToast(response.data.message || 'OTP generated successfully.', 'success');
      setStep(2);
    } catch (err: any) {
      showToast(err.message || 'Failed to request reset OTP. Check email.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !newPassword || !confirmPassword) {
      showToast('Please fill in all recovery fields.', 'error');
      return;
    }
    if (otp.length !== 6) {
      showToast('OTP must be exactly 6 digits.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters long.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await api.post('/api/auth/reset-password', {
        email,
        otp,
        new_password: newPassword,
      });
      showToast(response.data.message || 'Password reset successfully!', 'success');
      navigate('/login');
    } catch (err: any) {
      showToast(err.message || 'Failed to reset password. Check OTP.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      {/* Background Animated Blobs */}
      <div className="bg-mesh mesh-1" />
      <div className="bg-mesh mesh-2" />
      <div className="max-w-md w-full glass-card p-8 md:p-10 relative z-10">
        <div className="text-center mb-8">
          <h2 className="font-display font-black text-3xl text-white mb-2">
            {step === 1 ? 'Recover Password' : 'Verify Recovery OTP'}
          </h2>
          <p className="text-sm text-slate-400">
            {step === 1
              ? 'Request a security OTP to modify your credentials'
              : 'Enter the 6-digit verification code and new password'}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleRequestOtp} className="space-y-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Scientist Email
              </label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="scientist@isro.gov.in"
                  className="w-full bg-space-950/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent-purple focus:ring-1 focus:ring-accent-purple/20 transition-all font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-accent-purple to-accent-blue hover:opacity-90 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Generating Verification...' : 'Send Recovery OTP'}
              <FiArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-xs font-bold text-accent-blue hover:text-accent-blue/80 transition-colors uppercase tracking-wider"
              >
                <FiArrowLeft className="w-3.5 h-3.5" />
                Back to Sign In
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-5">
            {/* Alert Box for OTP logs retrieval */}
            <div className="bg-amber-950/20 border border-amber-500/20 rounded-xl p-4 flex gap-3 text-amber-200/90 mb-2">
              <FiAlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <span className="font-bold">Retrieval Note:</span> Please check your registered email inbox for the 6-digit OTP code. (Fallback: You can also copy the code from the **Systems Admin log dashboard**).
              </div>
            </div>

            {/* OTP Code */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Verification OTP
              </label>
              <div className="relative">
                <FiKey className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit OTP"
                  className="w-full bg-space-950/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent-purple focus:ring-1 focus:ring-accent-purple/20 transition-all font-medium tracking-widest text-center text-lg"
                />
              </div>
            </div>

            {/* New Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                New Secure Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-space-950/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent-purple focus:ring-1 focus:ring-accent-purple/20 transition-all font-medium"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Confirm Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full bg-space-950/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent-purple focus:ring-1 focus:ring-accent-purple/20 transition-all font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-accent-purple to-accent-blue hover:opacity-90 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? 'Resetting Password...' : 'Verify & Set Password'}
              <FiArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-wider"
              >
                <FiArrowLeft className="w-3.5 h-3.5" />
                Back to Request OTP
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
export default ForgotPasswordPage;
