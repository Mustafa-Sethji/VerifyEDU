import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import { User, Mail, GraduationCap, BookOpen, Save, Sparkles, ShieldCheck } from 'lucide-react';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const { addToast } = useNotification();

  const [name, setName] = useState(user?.name || '');
  const [department, setDepartment] = useState(user?.teacherProfile?.department || '');
  const [gradeLevel, setGradeLevel] = useState(user?.studentProfile?.gradeLevel || '');
  const [bio, setBio] = useState(user?.teacherProfile?.bio || user?.studentProfile?.bio || '');
  const [loading, setLoading] = useState(false);

  const isTeacher = user?.role === 'TEACHER';

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setDepartment(user.teacherProfile?.department || '');
      setGradeLevel(user.studentProfile?.gradeLevel || '');
      setBio(user.teacherProfile?.bio || user.studentProfile?.bio || '');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put('/users/profile', {
        name,
        department,
        gradeLevel,
        bio,
      });
      updateUser(res.data.user);
      addToast('Profile updated successfully!', 'success', 'Profile Updated');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title="User Profile" />

        <main className="p-8 max-w-4xl mx-auto w-full space-y-8">
          {/* User Profile Banner */}
          <div className="glass-card p-8 rounded-3xl border border-gray-200 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-green-600 to-emerald-500 p-1 shadow-2xl shadow-purple-500/30">
              <div className="w-full h-full bg-gray-50 rounded-[22px] flex items-center justify-center font-extrabold text-3xl text-green-600">
                {user?.name?.charAt(0) || 'U'}
              </div>
            </div>

            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl font-bold text-gray-900 font-['Outfit']">{user?.name}</h2>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    isTeacher
                      ? 'bg-green-50/60 text-green-600 border-purple-800/60'
                      : 'bg-green-50/60 text-green-600 border-blue-800/60'
                  }`}
                >
                  {user?.role}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
              <p className="text-[11px] text-gray-500 mt-2">
                Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Profile Form */}
          <div className="glass-card p-8 rounded-3xl border border-gray-200 space-y-6">
            <h3 className="text-lg font-bold text-gray-900 font-['Outfit'] border-b border-gray-200 pb-3">
              Edit Account Information
            </h3>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-900 text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Email (Read only)</label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200/60 text-gray-500 text-xs cursor-not-allowed"
                  />
                </div>
              </div>

              {isTeacher ? (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Department / Field</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Computer Science, Engineering, etc."
                    className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-900 text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Grade / Major</label>
                  <input
                    type="text"
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    placeholder="Senior Undergraduate, High School, etc."
                    className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-900 text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Bio / Overview</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share a short bio or academic interest..."
                  className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-900 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-gray-900 font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProfilePage;
