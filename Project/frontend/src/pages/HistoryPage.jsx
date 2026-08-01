import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import EmptyState from '../components/common/EmptyState';
import Skeleton from '../components/common/Skeleton';
import { History as HistoryIcon, Clock, Sparkles, CheckCircle2 } from 'lucide-react';

const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await api.get('/history');
        setHistory(res.data || []);
      } catch (err) {
        console.error('Error fetching history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title="Activity History & Audit Trail" />

        <main className="p-8 max-w-5xl mx-auto w-full space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight font-['Outfit'] font-bold">Activity Log</h2>
            <p className="text-xs text-gray-500">Complete record of your actions, quiz attempts, and classroom operations</p>
          </div>

          {loading ? (
            <Skeleton className="h-20 rounded-2xl" count={5} />
          ) : history.length === 0 ? (
            <EmptyState icon={HistoryIcon} title="No History Recorded Yet" description="Your activity history will be logged here as you interact with classrooms and quizzes." />
          ) : (
            <div className="glass-card p-6 rounded-3xl border border-gray-200 space-y-4">
              <div className="divide-y divide-gray-800">
                {history.map((item) => (
                  <div key={item.id} className="py-4 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-green-50/60 border border-purple-800/50 flex items-center justify-center text-green-600 shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 font-mono uppercase tracking-wider">{item.action}</h4>
                        <p className="text-xs text-gray-600 mt-0.5">{item.details || 'No additional details.'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500 shrink-0 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(item.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default HistoryPage;
