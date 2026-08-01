import React, { useState } from 'react';
import api from '../services/api';
import { useNotification } from '../context/NotificationContext';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import { Settings as SettingsIcon, Lock, Bell, Moon, ShieldCheck, Check } from 'lucide-react';

const SettingsPage = () => {
  const { addToast } = useNotification();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Preference Toggles State
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [quizNotifs, setQuizNotifs] = useState(true);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast('New passwords do not match.', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.put('/users/change-password', { currentPassword, newPassword });
      addToast('Password updated successfully!', 'success', 'Security Updated');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title="Platform Settings" />

        <main className="p-8 max-w-4xl mx-auto w-full space-y-8">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight font-['Outfit']">Settings & Preferences</h2>
            <p className="text-xs text-gray-500">Manage account security, notifications, and application preferences</p>
          </div>

          {/* Change Password Card */}
          <div className="glass-card p-8 rounded-3xl border border-gray-200 space-y-6">
            <h3 className="text-lg font-bold text-gray-900 font-['Outfit'] border-b border-gray-200 pb-3 flex items-center gap-2">
              <Lock className="w-5 h-5 text-green-600" />
              <span>Change Password</span>
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-900 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-900 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-900 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-gray-900 font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Preferences Card */}
          <div className="glass-card p-8 rounded-3xl border border-gray-200 space-y-6">
            <h3 className="text-lg font-bold text-gray-900 font-['Outfit'] border-b border-gray-200 pb-3 flex items-center gap-2">
              <Bell className="w-5 h-5 text-green-600" />
              <span>Notifications & Theme</span>
            </h3>

            <div className="space-y-4 max-w-md">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/60 border border-gray-200">
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Quiz Availability Alerts</h4>
                  <p className="text-[11px] text-gray-500">Receive notifications when a new quiz is posted</p>
                </div>
                <button
                  type="button"
                  onClick={() => setQuizNotifs(!quizNotifs)}
                  className={`w-12 h-6 rounded-full p-1 transition-all ${quizNotifs ? 'bg-green-600' : 'bg-gray-50'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${quizNotifs ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/60 border border-gray-200">
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Dark Theme Interface</h4>
                  <p className="text-[11px] text-gray-500">Optimized purple-blue dark mode</p>
                </div>
                <span className="text-xs font-bold text-green-600 bg-green-50/60 px-3 py-1 rounded-full border border-purple-800/60">
                  Active
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;
