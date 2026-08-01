import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import StatCard from '../components/common/StatCard';
import Skeleton from '../components/common/Skeleton';
import { BarChart3, TrendingUp, Award, Users, BookOpen, ListChecks } from 'lucide-react';

const Analytics = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const isTeacher = user?.role === 'TEACHER';

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const endpoint = isTeacher ? '/analytics/teacher' : '/analytics/student';
        const res = await api.get(endpoint);
        setData(res.data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [isTeacher]);

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title="Learning Analytics & Performance" />

        <main className="p-8 space-y-8 max-w-7xl mx-auto w-full">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight font-['Outfit']">Analytics Overview</h2>
            <p className="text-xs text-gray-500">
              {isTeacher
                ? 'Monitor aggregate classroom quiz scores and student engagement'
                : 'Track your personal test score trends and conceptual growth'}
            </p>
          </div>

          {loading ? (
            <Skeleton className="h-64 rounded-3xl" />
          ) : (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <StatCard
                  title="Average Score"
                  value={`${data?.averageScore || 0}%`}
                  icon={Award}
                  color="purple"
                  trend="+4.2% this month"
                />
                <StatCard
                  title={isTeacher ? 'Total Classrooms' : 'Joined Classrooms'}
                  value={isTeacher ? data?.totalClassrooms : data?.joinedClassroomsCount || 0}
                  icon={BookOpen}
                  color="blue"
                />
                <StatCard
                  title={isTeacher ? 'Total Quiz Attempts' : 'Quizzes Attempted'}
                  value={isTeacher ? data?.totalAttempts : data?.completedQuizzesCount || 0}
                  icon={ListChecks}
                  color="emerald"
                />
              </div>

              {/* Performance Trend Card */}
              <div className="glass-card p-8 rounded-3xl border border-gray-200 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900 font-['Outfit'] flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span>Score Progression & Trends</span>
                  </h3>
                  <span className="text-xs text-gray-500">Last 30 Days</span>
                </div>

                {/* Score Trend Bars */}
                <div className="space-y-4 pt-4">
                  {isTeacher ? (
                    data?.recentAttempts?.map((attempt, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-gray-700">{attempt.student?.name}</span>
                          <span className="font-bold text-green-600">{attempt.percentage}%</span>
                        </div>
                        <div className="w-full h-3 rounded-full bg-white overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-600 to-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(attempt.percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    )) || <p className="text-xs text-gray-500">No score history recorded yet.</p>
                  ) : (
                    data?.scoreTrend?.map((item, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-gray-700">{item.quizTitle}</span>
                          <span className="font-bold text-emerald-400">{item.score}%</span>
                        </div>
                        <div className="w-full h-3 rounded-full bg-white overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(item.score, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    )) || <p className="text-xs text-gray-500">No score history recorded yet.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Analytics;
