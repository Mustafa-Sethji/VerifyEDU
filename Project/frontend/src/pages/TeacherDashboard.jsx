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
  Users,
  FileText,
  Award,
  Plus,
  Copy,
  ChevronRight,
  Trash2,
  Edit,
  Sparkles,
  BookOpen,
} from 'lucide-react';

const TeacherDashboard = () => {
  const [stats, setStats] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassDesc, setNewClassDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const { addToast } = useNotification();
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, classroomsRes] = await Promise.all([
        api.get('/analytics/teacher'),
        api.get('/classrooms'),
      ]);
      setStats(analyticsRes.data);
      setClassrooms(classroomsRes.data);
    } catch (err) {
      console.error('Failed to load teacher dashboard data:', err);
      addToast('Error loading dashboard stats', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateClassroom = async (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    setCreating(true);
    try {
      const res = await api.post('/classrooms', {
        name: newClassName,
        description: newClassDesc,
      });
      addToast(`Classroom "${res.data.classroom.name}" created with code: ${res.data.classroom.code}`, 'success', 'Classroom Created');
      setIsCreateModalOpen(false);
      setNewClassName('');
      setNewClassDesc('');
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create classroom', 'error');
    } finally {
      setCreating(false);
    }
  };

  const copyCode = (code, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    addToast(`Classroom Code "${code}" copied to clipboard!`, 'success', 'Copied');
  };

  const handleDeleteClassroom = async (id, name, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete classroom "${name}"?`)) return;
    try {
      await api.delete(`/classrooms/${id}`);
      addToast(`Classroom "${name}" deleted.`, 'info');
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete classroom', 'error');
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title="Teacher Dashboard" />

        <main className="p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight font-['Outfit']">Overview & Classrooms</h2>
              <p className="text-xs text-gray-500">Manage your virtual classrooms and monitor student progress</p>
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-gray-900 font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Classroom</span>
            </button>
          </div>

          {/* Statistics Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Skeleton className="h-32 rounded-2xl" count={4} />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Students"
                value={stats?.totalStudents || 0}
                icon={Users}
                color="purple"
                subtitle="Enrolled across classrooms"
              />
              <StatCard
                title="Total Classrooms"
                value={stats?.totalClassrooms || 0}
                icon={GraduationCap}
                color="blue"
                subtitle="Active learning hubs"
              />
              <StatCard
                title="Total Documents"
                value={stats?.totalDocuments || 0}
                icon={FileText}
                color="emerald"
                subtitle="PDF study materials uploaded"
              />
              <StatCard
                title="Average Quiz Score"
                value={`${stats?.averageScore || 0}%`}
                icon={Award}
                color="amber"
                subtitle="Across all student attempts"
              />
            </div>
          )}

          {/* Classrooms Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 font-['Outfit']">Your Classrooms</h3>
              <span className="text-xs text-gray-500 font-medium">{classrooms.length} Total</span>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Skeleton className="h-44 rounded-2xl" count={3} />
              </div>
            ) : classrooms.length === 0 ? (
              <EmptyState
                icon={GraduationCap}
                title="No Classrooms Created Yet"
                description="Get started by creating your first virtual classroom. Students will use a unique code to join."
                actionLabel="Create First Classroom"
                onAction={() => setIsCreateModalOpen(true)}
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
                        <div className="w-10 h-10 rounded-xl bg-green-50/60 border border-purple-800/50 flex items-center justify-center text-green-600">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <button
                          onClick={(e) => handleDeleteClassroom(c.id, c.name, e)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-950/40 opacity-0 group-hover:opacity-100 transition-all"
                          title="Delete Classroom"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <h4 className="text-lg font-bold text-gray-900 font-['Outfit'] group-hover:text-green-600 transition-colors">
                        {c.name}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {c.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-200/80 flex items-center justify-between">
                      {/* Code Badge */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Code:</span>
                        <button
                          onClick={(e) => copyCode(c.code, e)}
                          className="px-2.5 py-1 rounded-lg bg-green-50/80 border border-purple-800/60 text-green-600 text-xs font-mono font-bold hover:bg-green-100 transition-all flex items-center gap-1.5"
                          title="Click to copy code"
                        >
                          <span>{c.code}</span>
                          <Copy className="w-3 h-3 text-green-600" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{c._count?.members || 0} Students</span>
                        <ChevronRight className="w-4 h-4 text-gray-500 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Create Classroom Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New Classroom"
        >
          <form onSubmit={handleCreateClassroom} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Classroom Name</label>
              <input
                type="text"
                required
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                placeholder="e.g. Advanced Physics 101"
                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder-gray-500 text-xs focus:outline-none focus:border-purple-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Description (Optional)</label>
              <textarea
                rows={3}
                value={newClassDesc}
                onChange={(e) => setNewClassDesc(e.target.value)}
                placeholder="Brief course overview or syllabus topic..."
                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder-gray-500 text-xs focus:outline-none focus:border-purple-500 transition-all"
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-gray-500 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-gray-900 font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {creating ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span>Create Classroom</span>
                )}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default TeacherDashboard;
