import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useNotification } from '../context/NotificationContext';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import StatCard from '../components/common/StatCard';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';
import Skeleton from '../components/common/Skeleton';
import {
  GraduationCap,
  Award,
  ListChecks,
  Plus,
  ChevronRight,
  LogOut,
  Sparkles,
  BookOpen,
  TrendingUp,
} from 'lucide-react';

const StudentDashboard = () => {
  const [stats, setStats] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Join Classroom Modal State
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [classroomCode, setClassroomCode] = useState('');
  const [joining, setJoining] = useState(false);

  const { addToast } = useNotification();
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, classroomsRes] = await Promise.all([
        api.get('/analytics/student'),
        api.get('/classrooms'),
      ]);
      setStats(analyticsRes.data);
      setClassrooms(classroomsRes.data);
    } catch (err) {
      console.error('Failed to load student dashboard data:', err);
      addToast('Error loading student dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleJoinClassroom = async (e) => {
    e.preventDefault();
    if (!classroomCode.trim()) return;
    setJoining(true);
    try {
      const res = await api.post('/classrooms/join', { code: classroomCode.trim() });
      addToast(res.data.message || 'Joined classroom!', 'success', 'Classroom Joined');
      setIsJoinModalOpen(false);
      setClassroomCode('');
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to join classroom', 'error');
    } finally {
      setJoining(false);
    }
  };

  const handleLeaveClassroom = async (id, name, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to leave classroom "${name}"?`)) return;
    try {
      await api.post(`/classrooms/${id}/leave`);
      addToast(`Left classroom "${name}".`, 'info');
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to leave classroom', 'error');
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title="Student Dashboard" />

        <main className="p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Action Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight font-['Outfit']">My Learning Workspace</h2>
              <p className="text-xs text-gray-500">View enrolled classrooms, attempt AI quizzes, and track performance</p>
            </div>

            <button
              onClick={() => setIsJoinModalOpen(true)}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-gray-900 font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Join Classroom</span>
            </button>
          </div>

          {/* Stats Bar */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Skeleton className="h-32 rounded-2xl" count={3} />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <StatCard
                title="Joined Classrooms"
                value={stats?.joinedClassroomsCount || 0}
                icon={GraduationCap}
                color="blue"
                subtitle="Active enrolled courses"
              />
              <StatCard
                title="Quizzes Completed"
                value={stats?.completedQuizzesCount || 0}
                icon={ListChecks}
                color="purple"
                subtitle="AI assessments attempted"
              />
              <StatCard
                title="Average Overall Score"
                value={`${stats?.averageScore || 0}%`}
                icon={Award}
                color="emerald"
                subtitle="Comprehensive performance"
              />
            </div>
          )}

          {/* Joined Classrooms Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 font-['Outfit'] font-bold">Enrolled Classrooms</h3>
              <span className="text-xs text-gray-500 font-medium">{classrooms.length} Active</span>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Skeleton className="h-44 rounded-2xl" count={3} />
              </div>
            ) : classrooms.length === 0 ? (
              <EmptyState
                icon={GraduationCap}
                title="Not Enrolled in Any Classrooms"
                description="Join your first classroom using the 6-character code provided by your teacher."
                actionLabel="Join Classroom Now"
                onAction={() => setIsJoinModalOpen(true)}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classrooms.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => navigate(`/classrooms/${c.id}`)}
                    className="glass-card p-6 rounded-2xl border border-gray-200 glass-card-hover cursor-pointer relative group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-green-50/60 border border-blue-800/50 flex items-center justify-center text-green-600">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <button
                          onClick={(e) => handleLeaveClassroom(c.id, c.name, e)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-950/40 opacity-0 group-hover:opacity-100 transition-all"
                          title="Leave Classroom"
                        >
                          <LogOut className="w-4 h-4" />
                        </button>
                      </div>

                      <h4 className="text-lg font-bold text-gray-900 font-['Outfit'] group-hover:text-green-600 transition-colors">
                        {c.name}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        Instructor: <span className="text-gray-600 font-semibold">{c.teacher?.name}</span>
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-200/80 flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-3">
                        <span>{c._count?.documents || 0} Materials</span>
                        <span>•</span>
                        <span>{c._count?.quizzes || 0} Quizzes</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Join Classroom Modal */}
        <Modal
          isOpen={isJoinModalOpen}
          onClose={() => setIsJoinModalOpen(false)}
          title="Join a Classroom"
        >
          <form onSubmit={handleJoinClassroom} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Classroom Code</label>
              <input
                type="text"
                required
                maxLength={6}
                value={classroomCode}
                onChange={(e) => setClassroomCode(e.target.value.toUpperCase())}
                placeholder="e.g. EDU89X"
                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder-gray-500 text-sm font-mono tracking-wider text-center uppercase focus:outline-none focus:border-blue-500 transition-all"
              />
              <p className="text-[11px] text-gray-500 mt-2 text-center">
                Ask your teacher for the 6-character classroom code.
              </p>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsJoinModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-gray-500 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={joining}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-gray-900 font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {joining ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span>Join Classroom</span>
                )}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default StudentDashboard;
